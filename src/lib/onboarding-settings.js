import {callSupabaseRpc} from '@/api/supabaseClient';
import {withTimeout} from './bounded-operation';
export const SETTING_KEYS=['profile_view_visibility','notif_email','notif_circle','personalized_recommendations','analytics_consent','notifications_enabled'];
export const SETTINGS_BY_STEP={notifications:['notifications_enabled','notif_email','notif_circle'],privacy:['profile_view_visibility','personalized_recommendations','analytics_consent']};
export function explicitSettings(data,step) {
 const changes=data?._settingsChanges;
 if(!changes||typeof changes!=='object'||Array.isArray(changes))return {};
 return Object.fromEntries(Object.entries(changes).filter(([key])=>(SETTINGS_BY_STEP[step]||[]).includes(key)));
}
function valid(key,value){return key==='profile_view_visibility'?['visible','private'].includes(value):typeof value==='boolean';}
export async function getOnboardingSettings(options) {
 const result=await withTimeout(()=>callSupabaseRpc('nmood_get_my_onboarding_settings',{},options));
 if(!result||SETTING_KEYS.some(key=>key==='profile_view_visibility'?result[key]!==null&&!valid(key,result[key]):!valid(key,result[key])))throw new Error('Settings unavailable.');
 return Object.fromEntries(SETTING_KEYS.map(key=>[key,result[key]]));
}
export async function saveOnboardingSettings(changes,options) {
 if(!Object.keys(changes).length)return null; // Omission never invokes a writer.
 if(Object.entries(changes).some(([key,value])=>!SETTING_KEYS.includes(key)||!valid(key,value)))throw new Error('Choose the setting again.');
 const result=await withTimeout(()=>callSupabaseRpc('nmood_save_my_onboarding_settings',{p_changes:changes},options));
 if(!result||Object.entries(changes).some(([key,value])=>result[key]!==value))throw new Error('Settings save was not confirmed.');
 return Object.fromEntries(SETTING_KEYS.filter(key=>Object.hasOwn(result,key)).map(key=>[key,result[key]]));
}
