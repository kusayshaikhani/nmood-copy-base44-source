import { STAGE1_COUNTRIES, normalizeStage1Phone } from '../../supabase/functions/_shared/stage1-phone.mjs';
import { invokeSupabaseFunction, callSupabaseRpc } from '@/api/supabaseClient';
import { parsePhoneNumberFromString, getCountryCallingCode } from 'libphonenumber-js/max';
const ERROR_MESSAGES = {
 invalid_phone:'auth.error_invalid_phone',invalid_or_expired_code:'auth.error_invalid_code',too_many_requests:'auth.error_too_many_phone_attempts',verification_busy:'auth.error_too_many_phone_attempts',provider_unavailable:'auth.error_phone_provider_unavailable',not_authorized:'auth.error_expired_session',verification_save_failed:'auth.error_phone_save_failed',
};
const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
export const phoneCountries = STAGE1_COUNTRIES.map(code => ({
 code, dial: getCountryCallingCode(code), label: `${regionNames.of(code) || code} (+${getCountryCallingCode(code)})`,
})).sort((a,b) => a.label.localeCompare(b.label));
export function normalizePhoneForVerification(raw,country){
 try{return normalizeStage1Phone(raw,country,parsePhoneNumberFromString);}catch{const e=new Error('invalid_phone');e.code='invalid_phone';throw e;}
}
export function getPhoneVerificationErrorKey(error){return ERROR_MESSAGES[error?.code]||'auth.error_phone_provider_unavailable';}
async function call(payload){
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),45000);
 try{const r=await invokeSupabaseFunction('phone-verification',payload,{signal:controller.signal});if(!r?.ok)throw r;return r;}
 catch(error){const code=error?.status===401 ? 'not_authorized' : error?.error||error?.message;const e=new Error(ERROR_MESSAGES[code]?code:'provider_unavailable');e.code=e.message;e.reason=Object.hasOwn(PHONE_FAILURE_ACTIONS,error?.reason)?error.reason:undefined;e.retryAfter=Number(error?.retry_after)||0;throw e;}
 finally{clearTimeout(timer);}
}
export const readPhoneVerification=(expectedUserId)=>callSupabaseRpc('nmood_my_phone_state',{},expectedUserId?{expectedUserId}:{});
export async function startPhoneVerification(raw,country){return call({action:'start',phone:normalizePhoneForVerification(raw,country),country});}
export async function checkPhoneVerification(challenge_id,code){return call({action:'check',challenge_id,code:String(code||'').trim()});}
export const recoverPhoneVerification=()=>call({action:'recover'});

// Shared +1 calling code always requires explicit US/Canada selection.
export function phoneCountryFromInput(raw) {
 const value = String(raw || '').trim().replace(/[\s()-]/g, '').replace(/^00/, '+');
 if (!value.startsWith('+')) return '';
 const parsed = parsePhoneNumberFromString(value, { extract: false });
 if (value.startsWith('+1')) return ''; // US/Canada must be chosen explicitly.
 if (parsed?.country) return STAGE1_COUNTRIES.includes(parsed.country) ? parsed.country : ''; 
 const candidates = phoneCountries.filter(c => value.startsWith('+' + c.dial));
 return candidates.length === 1 ? candidates[0].code : '';
}

// Fixed public guidance only: never render raw provider bodies, credentials or codes.
export const PHONE_FAILURE_ACTIONS = Object.freeze({
 authentication:'SMS verification needs an administrator configuration fix. Contact support; retrying will not help.',
 permission:'The verification service denied access. Contact support; retrying will not help.',
 service_not_found:'The verification service is not configured correctly. Contact support.',
 configuration:'SMS verification setup is incomplete. Contact support.',
 timeout:'The verification service timed out. Wait before trying again; a code may already be on its way.',
 network:'The verification service could not be reached. Wait before trying again.',
 dns:'The verification service could not be reached. Wait before trying again.',
 tls:'A secure connection to the verification service failed. Contact support.',
 provider_server:'The SMS provider is unavailable. Wait before trying again.',
 malformed_response:'The verification service returned an unexpected response. Contact support.',
 rejected:'The SMS provider declined this request. Contact support.'
});
export function phoneVerificationGuidance(error) {
 if(error?.code==='not_authorized')return 'Your session has expired. Sign in again, then reopen phone verification.';
 if(error?.code==='too_many_requests'||error?.code==='verification_busy')return 'Please wait for the cooldown before trying again.';
 if(error?.code==='verification_save_failed')return 'Verification could not be saved. Reopen this screen to recover the result before requesting another code.';
 return PHONE_FAILURE_ACTIONS[error?.reason] || null;
}

// Keep a single selected calling code. Never rewrite a foreign full number.
export function phoneEntryForCountry(raw,country){
 const selected=phoneCountries.find(c=>c.code===country);
 if(!selected)return String(raw||'');
 let value=String(raw||'').trim().replace(/[\s()-]/g,'').replace(/^00/,'+');
 const prefix='+'+selected.dial;
 if(value.startsWith('+')&&!value.startsWith(prefix))return value;
 let local=value.startsWith(prefix)?value.slice(prefix.length):value;
 // Repair duplicate calling codes only when the resulting number is valid.
 while(local.startsWith(selected.dial)){
  const candidate=local.slice(selected.dial.length);
  try{normalizePhoneForVerification(prefix+candidate,country);local=candidate;}catch{break;}
 }
 if(!local)return prefix;
 try{return normalizePhoneForVerification(local,country);}catch{return prefix+local.replace(/\D/g,'');}
}
