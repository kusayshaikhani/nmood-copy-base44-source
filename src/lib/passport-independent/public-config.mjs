export const ISOLATED_PROJECT='iyxxorbmucsrechxkkxj';
export const ISOLATED_ENDPOINT=`https://${ISOLATED_PROJECT}.supabase.co/functions/v1/passport-isolated-synthetic-v1`;
export function readPublicConfig(value){
 if(!value||value.project!==ISOLATED_PROJECT||value.endpoint!==ISOLATED_ENDPOINT)return null;
 if(Object.keys(value).some(k=>!['project','endpoint','publishableKey'].includes(k)))return null;
 // Only provider public publishable keys. Never accept JWT service keys or arbitrary URLs.
 if(typeof value.publishableKey!=='string'||!/^sb_publishable_[A-Za-z0-9_-]{20,}$/.test(value.publishableKey))return null;
 return Object.freeze({isolatedProject:ISOLATED_PROJECT,isolatedPublishableKey:value.publishableKey});
}
// Explicit build definition; no env file, local storage or remote configuration fallback.
export const passportPublicConfig=readPublicConfig(typeof __NMOOD_PASSPORT_PUBLIC_CONFIG__==='undefined'?null:__NMOOD_PASSPORT_PUBLIC_CONFIG__);
