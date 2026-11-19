// Internal transport state machine only; public client.mjs enforces the immutable release guard.
import {acceptResponse} from './policy.mjs';
export function createSessionCore({transport}={}) {
 let generation=0,context=null,cache=null;
 function reset(next=null){generation++;context=next?{...next}:null;cache=null;}
 async function invoke(operation,args={}) {
  const g=generation,active=context?{...context}:null;
  if(!active?.actorId)return {ok:false,reason:'CONTEXT',data:null};
  const request={operation,epoch:active.epoch,entitlementVersion:active.entitlementVersion,destination:operation==='destination'?args.destination:active.destination};
  if(['detail','join','leave'].includes(operation))request.contentId=args.contentId;
  let response;
  try {response=await transport(request);} catch {if(g===generation)reset();return {ok:false,reason:'TRANSPORT',data:null};}
  if(g!==generation)return {ok:false,reason:'STALE',data:null};
  if(response?.ok!==true){reset();return {ok:false,reason:'DENIED',data:null};}
  const marker={actorId:response.actorId,epoch:response.epoch,destination:response.destination,entitlementVersion:response.entitlementVersion};
  let valid=response.actorId===active.actorId&&Number.isSafeInteger(response.epoch)&&Number.isSafeInteger(response.entitlementVersion)&&response.epoch>=0&&response.entitlementVersion>=1&&['FR','JP'].includes(response.destination);
  if(operation==='destination')valid=valid&&response.epoch===active.epoch+1&&response.destination===args.destination&&response.entitlementVersion===active.entitlementVersion;
  else if(!['status','reconnect'].includes(operation))valid=valid&&acceptResponse(active,response);
  if(!valid){reset();return {ok:false,reason:'STALE',data:null};}
  if(['status','reconnect','destination'].includes(operation)){reset(marker);}else cache=response.data;
  return response;
 }
 return {invoke,reset,disconnect:()=>reset(),snapshot:()=>({generation,context:context?{...context}:null,cache})};
}
