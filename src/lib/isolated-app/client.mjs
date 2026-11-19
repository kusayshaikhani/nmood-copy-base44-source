import {mobileRequest} from '../passport-independent/mobile-request.mjs';
import {passportPublicConfig} from '../passport-independent/public-config.mjs';
const ENDPOINT='https://iyxxorbmucsrechxkkxj.supabase.co/functions/v1/nmood-isolated-app-v1';
export function createIsolatedAppClient({getSession,isCurrent,request=mobileRequest,key=passportPublicConfig?.isolatedPublishableKey,actor='0faa8a55-291e-4097-b02c-6e7e7b95d758'}){
 if(typeof getSession!=='function'||typeof isCurrent!=='function')throw Error('ISOLATED_SESSION_REQUIRED');
 async function invoke(operation,input){
  if(!isCurrent()||!/^sb_publishable_[A-Za-z0-9_-]{20,}$/.test(key||''))throw Error('ISOLATED_SESSION_REQUIRED');
  const session=await getSession();if(!isCurrent()||session?.user?.id!==actor||typeof session.access_token!=='string')throw Error('ISOLATED_SESSION_REQUIRED');
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
  try{const response=await request(ENDPOINT,{method:'POST',headers:{apikey:key,authorization:'Bearer '+session.access_token,'content-type':'application/json'},body:JSON.stringify({operation,input}),signal:controller.signal,redirect:'error',credentials:'omit',cache:'no-store'});if(!isCurrent())throw Error('ISOLATED_SESSION_REQUIRED');if(response.status!==200&&response.status!==202)throw Error('ISOLATED_DENIED');const body=await response.json();if(!isCurrent()||!body||Object.keys(body).join(',')!=='data')throw Error('ISOLATED_RESPONSE');return body.data;}finally{clearTimeout(timer);}
 }
 return {actorId:actor,social:input=>invoke('social',input),groups:input=>invoke('groups',input),bootstrap:()=>invoke('bootstrap',{}),profile:input=>invoke('profile',input),blocks:input=>invoke('blocks',input),posts:input=>invoke('posts',input),membership:()=>invoke('membership',{}),reconcileMembership:()=>invoke('membership.reconcile',{}),adminRead:input=>invoke('admin.read',input),media:input=>invoke('media',input),session:()=>invoke('session',{}),conversations:input=>invoke('conversations',input),records:input=>invoke('records',input),messages:input=>invoke('messages',input),adminDelete:input=>invoke('admin.delete',input)};
}
