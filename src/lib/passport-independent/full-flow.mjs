import {createIsolatedAppClient} from '../isolated-app/client.mjs';
import {createIsolatedCountryRuntime} from '../country-verification/isolated-runtime.mjs';
import {mobileRequest} from './mobile-request.mjs';
import {ACTOR,EMAIL,ORIGIN,verifyToken} from './status-only.mjs';
import {passportPublicConfig} from './public-config.mjs';
import {createSessionCore} from './client-core.mjs';
export {EMAIL};
// A separate memory-only session. Never read or update normal Nmood auth storage.
export function createPassportFlow({request=mobileRequest,verify=verifyToken,key=passportPublicConfig?.isolatedPublishableKey}={}) {
 let token=null,generation=0,pending=null;
 const core=createSessionCore({transport:async body=>{
  if(!token)throw Error('SIGNED_OUT');await verify(token);
  const response=await request(ORIGIN+'/functions/v1/passport-isolated-synthetic-v1',{method:'POST',headers:{apikey:key,Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(body),credentials:'omit',cache:'no-store',redirect:'error',signal:pending?.signal});
  if(response.status!==200)throw Error('DENIED');return response.json();
 }});
 function disconnect(){generation++;pending?.abort();pending=null;token=null;core.disconnect();}
 async function run(operation,args={}){if(pending)return {ok:false,reason:'BUSY',data:null};const ticket=generation;const controller=new AbortController();pending=controller;const timer=setTimeout(()=>controller.abort(),30000);try{const result=await core.invoke(operation,args);return result;}finally{clearTimeout(timer);if(pending===controller)pending=null;}}
 function countryRuntime(){
  const ticket=generation;
  return createIsolatedCountryRuntime({isCurrent:()=>ticket===generation&&!!token,getIsolatedSession:async()=>{const candidate=token;if(!candidate||ticket!==generation)throw Error('unavailable');await verify(candidate);if(ticket!==generation||candidate!==token)throw Error('unavailable');return {user:{id:ACTOR},access_token:candidate};}});
 }
 function appClient(){const ticket=generation;return createIsolatedAppClient({key,isCurrent:()=>ticket===generation&&!!token,getSession:async()=>{const candidate=token;if(!candidate||ticket!==generation)throw Error('unavailable');await verify(candidate);if(ticket!==generation||token!==candidate)throw Error('unavailable');return {user:{id:ACTOR},access_token:candidate};}});}
 return {appClient,countryRuntime,async signin(password){disconnect();const ticket=generation,controller=new AbortController();pending=controller;const timer=setTimeout(()=>controller.abort(),30000);try{if(!/^sb_publishable_[A-Za-z0-9_-]{20,}$/.test(key||''))throw Error();const response=await request(ORIGIN+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify({email:EMAIL,password}),credentials:'omit',cache:'no-store',redirect:'error',signal:controller.signal});password='';if(response.status!==200)throw Error();let body=await response.json();let candidate=body.access_token;body=null;await verify(candidate);if(ticket!==generation||controller.signal.aborted)throw Error();token=candidate;candidate=null;core.reset({actorId:ACTOR});return {ok:true};}catch{if(ticket===generation)disconnect();return {ok:false,reason:'SIGN_IN',data:null};}finally{password='';clearTimeout(timer);if(pending===controller)pending=null;}},invoke:run,reconnect:()=>{if(token)core.reset({actorId:ACTOR});return run('reconnect');},disconnect,snapshot:core.snapshot};
}
export const flow=createPassportFlow();
