import {createSessionCore} from './client-core.mjs';
export const PROJECT='vudvrofhxwopgbldunky';
export const ORDINARY_RELEASE_APPROVED=false;
export function eligible(binding,session){return binding?.project===PROJECT&&binding.syntheticReleaseApproved===true&&binding.serverDeploymentVerified===true&&binding.storeProject==='iyxxorbmucsrechxkkxj'&&binding.syntheticActorId==='ec540bce-c425-4f96-a294-0a70c5b29765'&&session?.user?.id===binding.syntheticActorId;}
export function createIntegration({binding,getSession,transport}){
 const core=createSessionCore({transport:async request=>{
  const session=getSession();if(!eligible(binding,session))throw Error('DISABLED');
  const actor=session.user.id;const response=await transport(request,{expectedUserId:actor});
  if(!eligible(binding,getSession())||getSession().user.id!==actor)throw Error('ACCOUNT_CHANGED');
  return response;
 }});let actor=null;
 return {async invoke(operation,args={}){
  const session=getSession();if(!eligible(binding,session)){actor=null;core.disconnect();return {ok:false,reason:'DISABLED',data:null};}
  if(actor!==session.user.id){actor=session.user.id;core.reset({actorId:actor});}
  return core.invoke(operation,args);
 },disconnect(){actor=null;core.disconnect();},snapshot:core.snapshot};
}
