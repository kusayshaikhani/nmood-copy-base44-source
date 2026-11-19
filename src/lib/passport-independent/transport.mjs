import {eligible} from './integration.mjs';
export function createTransport({binding,getSession,publicConfig,fetchImpl=globalThis.fetch}){
 return async(request)=>{
  const session=getSession();if(!eligible(binding,session)||!session.access_token||!publicConfig?.isolatedPublishableKey||publicConfig?.isolatedProject!=='iyxxorbmucsrechxkkxj')throw Error('DISABLED');
  const actor=session.user.id,token=session.access_token;
  const response=await fetchImpl('https://iyxxorbmucsrechxkkxj.supabase.co/functions/v1/passport-isolated-synthetic-v1',{method:'POST',headers:{apikey:publicConfig.isolatedPublishableKey,Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(request),redirect:'error',credentials:'omit'});
  if(!eligible(binding,getSession())||getSession().user.id!==actor||getSession().access_token!==token||!response.ok)throw Error('WITHDRAWN');
  return response.json();
 };
}
