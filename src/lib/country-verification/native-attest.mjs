import {Capacitor,registerPlugin} from '@capacitor/core';
const Native=registerPlugin('NmoodCountryAttest');
// No coordinates cross the bridge and no caller-supplied country is signed.
// The native implementation independently detects and constructs its assertion.
export function createNativeCountryAttestation({getIsolatedSession,expectedActor='0faa8a55-291e-4097-b02c-6e7e7b95d758'}){
 if(typeof getIsolatedSession!=='function')throw Error('unavailable');
 return async({actor,country})=>{
  if(!Capacitor.isNativePlatform()||Capacitor.getPlatform()!=='ios'||actor!==expectedActor)throw Error('unavailable');
  const session=await getIsolatedSession();
  if(session?.user?.id!==actor||typeof session.access_token!=='string')throw Error('unavailable');
  let result;
  try {result=await Native.proof({sessionJwt:session.access_token});}
  catch(error){throw Error(({COUNTRY_ATTEST_UNSUPPORTED:"unsupported",COUNTRY_RECOVERY_REQUIRED:"recovery",COUNTRY_PERMISSION_DENIED:"denied"})[error?.message]||"unavailable");}
  if(result?.country!==country)throw Error('mismatch');
  if(typeof result.proof!=='string'||result.proof.length>4096)throw Error('unavailable');
  return result.proof;
 };
}
export function createNativeCountryTransport({getIsolatedSession,expectedActor='0faa8a55-291e-4097-b02c-6e7e7b95d758'}){
 return async(operation,data,{expectedUserId})=>{
  if(!['status','confirm','preferences'].includes(operation)||expectedUserId!==expectedActor||Capacitor.getPlatform()!=='ios')throw Error('unavailable');
  const session=await getIsolatedSession();if(session?.user?.id!==expectedUserId||typeof session.access_token!=='string')throw Error('unavailable');
  return Native.request({operation,data,sessionJwt:session.access_token});
 };
}

export function createNativeCountryRecovery({getIsolatedSession,expectedActor='0faa8a55-291e-4097-b02c-6e7e7b95d758'}){
 return async()=>{
  if(!Capacitor.isNativePlatform()||Capacitor.getPlatform()!=='ios')throw Error('unsupported');
  const session=await getIsolatedSession();
  if(session?.user?.id!==expectedActor||typeof session.access_token!=='string')throw Error('unavailable');
  try{const r=await Native.recover({sessionJwt:session.access_token});if(r?.reverificationRequired!==true)throw Error();return {reverificationRequired:true};}
  catch(e){throw Error(e?.message==='COUNTRY_ATTEST_UNSUPPORTED'?'unsupported':'recovery');}
 };
}
