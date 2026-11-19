import {verifyToken,ORIGIN} from './token.mjs';
// Isolated memory only. No production storage, service key, caller-selected host or auto-signup retry.
export function createCustomerSession({key,request,verify=verifyToken}){
 let session=null,generation=0;const listeners=new Set();
 const notify=()=>{for(const f of listeners)f();};
 const clear=()=>{generation++;session=null;notify();};
 async function send(path,body){
  if(!/^sb_publishable_[A-Za-z0-9_-]{20,}$/.test(key||''))throw Error('CONFIGURATION');
  const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),25000);
  try{const r=await request(ORIGIN+path,{method:'POST',headers:{apikey:key,'content-type':'application/json'},body:JSON.stringify(body),credentials:'omit',redirect:'error',cache:'no-store',signal:abort.signal});
   const result=await r.json();if(![200,201].includes(r.status)){const e=Error('AUTHENTICATION_FAILED');e.status=r.status;const allowed=['email_not_confirmed','user_already_exists','email_exists','email_address_invalid','email_provider_disabled','signup_disabled','email_address_not_authorized','weak_password','over_email_send_rate_limit','over_request_rate_limit'];if(allowed.includes(result?.code||result?.error_code))e.code=result.code||result.error_code;throw e;}return result;
  }finally{clearTimeout(timer);}
 }
 async function accept(data,ticket){
  if(!data?.access_token)throw Error('AUTHENTICATION_FAILED');const id=await verify(data.access_token);
  if(ticket!==generation||!data.user||data.user.id!==id.id)throw Error('SESSION_CHANGED');
  session=Object.freeze({access_token:data.access_token,expires_at:id.expires_at,user:Object.freeze({id:id.id,email:typeof data.user.email==='string'?data.user.email:null})});notify();return session;
 }
 function credentials(email,password){if(typeof email!=='string'||email.length>254||!/^\S+@\S+\.\S+$/.test(email)||typeof password!=='string'||!password||password.length>1024)throw Error('AUTHENTICATION_FAILED');}
 return {
  subscribe(f){listeners.add(f);return()=>listeners.delete(f);},clear,
  snapshot:()=>session,
  async verified(){const s=session;if(!s)throw Error('SIGNED_OUT');const id=await verify(s.access_token);if(s!==session||id.id!==s.user.id)throw Error('SESSION_CHANGED');return s;},
  async signin(email,password){credentials(email,password);clear();const ticket=generation;return accept(await send('/auth/v1/token?grant_type=password',{email:email.trim(),password}),ticket);},
  async resendSignup(email){credentials(email,'unused');await send('/auth/v1/resend',{type:'signup',email:email.trim()});return {};},
  async signup(email,password){credentials(email,password);clear();const ticket=generation;const body=await send('/auth/v1/signup',{email:email.trim(),password});if(ticket!==generation)throw Error('SESSION_CHANGED');if(body.access_token)return accept(body,ticket);const user=body.user||body;if(typeof user.id!=='string'||! /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(user.id))throw Error('AUTHENTICATION_FAILED');return {confirmationRequired:true,user:{id:user.id}};}
 };
}
