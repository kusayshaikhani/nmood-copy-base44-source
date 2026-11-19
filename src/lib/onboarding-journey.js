import { normalizeLookingForTags } from './looking-for-tags';

// Inventory of editable member fields, not account lifecycle or generated data.
// Each field has exactly one collection step. Gallery is saved independently.
export const ONBOARDING_STEPS = [
 {key:'eligibility', title:'Your age (optional)', fields:['date_of_birth']},
 {key:'profile', title:'Your profile', fields:['display_name','photo_url','gender','dating_looking_for_gender','bio']},
 {key:'personal', title:'Optional personal details', fields:['nationality','show_age','marital_status','family_plan','share_marital_status','share_family_plan','smoking','drinking','share_smoking','share_drinking','height_cm','work_text','share_height','share_work']},
 {key:'interests', title:'Your interests', fields:['interests']},
 {key:'looking_for', title:'What are you looking for?', fields:['looking_for_tags']},
 {key:'lifestyle', title:'Lifestyle and Zodiac', fields:['lifestyle','zodiac']},
 {key:'languages', title:'Languages you speak', fields:['languages']},
 {key:'location', title:'Where you live', fields:['country','city','location_enabled']},
 {key:'gallery', title:'Your Gallery', fields:['photo_gallery']},
 {key:'notifications', title:'Notifications', fields:['notifications_enabled','notif_email','notif_circle']},
 {key:'privacy', title:'Privacy and sharing', fields:['profile_visibility','who_can_message','show_online_status','show_last_seen','show_distance','indicator_distance_consent','indicator_presence_consent','indicator_distance_calculation','profile_view_visibility','personalized_recommendations','analytics_consent']},
 {key:'complete', title:'Review and finish', fields:[]},
];
export const ONBOARDING_DRAFT_VERSION = 2;
export const ONBOARDING_DRAFT_KEY = 'nmood.onboarding-draft.v2';
const keys = new Set([...ONBOARDING_STEPS.flatMap(step=>step.fields), '_workDraft', '_personalChanges', '_settingsChanges', 'indicator_distance_consent','indicator_presence_consent','indicator_distance_calculation','first_name','last_name','country_code','state','timezone']);
export function draftFields(data = {}) {
 return Object.fromEntries(Object.entries(data).filter(([key])=>keys.has(key)));
}
export function readOnboardingDraft(userId) {
 try {const draft=JSON.parse(sessionStorage.getItem(ONBOARDING_DRAFT_KEY));return draft?.version===ONBOARDING_DRAFT_VERSION&&draft.userId===userId&&draft.data&&typeof draft.data==='object'&&!Array.isArray(draft.data)&&Array.isArray(draft.reviewed)?draft:null;} catch {return null;}
}
export function storeOnboardingDraft(draft) {
 try {sessionStorage.setItem(ONBOARDING_DRAFT_KEY,JSON.stringify({...draft,data:draftFields(draft.data)}));return true;} catch {return false;}
}
export function clearOnboardingDraft() {try {sessionStorage.removeItem(ONBOARDING_DRAFT_KEY);} catch { /* unavailable storage */ }}
export function onboardingStepsFor() {
 return ONBOARDING_STEPS;
}
export function reviewedPrefix(reviewed, steps = ONBOARDING_STEPS) {
 let length=0;
 for(const step of steps.slice(0,-1)){if(!Array.isArray(reviewed)||reviewed[length]!==step.key)break;length++;}
 return length;
}
export function resumeStep(draft, steps = ONBOARDING_STEPS) {
 const maximum=reviewedPrefix(draft?.reviewed, steps);
 return Number.isInteger(draft?.step)?Math.max(0,Math.min(draft.step,maximum)):0;
}
export function stepValidation(key,data) {
 if(key==='profile'){
  if(!data.display_name?.trim())return 'Enter your display name to continue.';
  if(!data.photo_url)return 'Add a profile photo to continue.';
  if(!['male','female'].includes(data.gender))return 'Choose whether you are a man or woman to continue.';
  if(!['male','female','community_only'].includes(data.dating_looking_for_gender))return 'Choose how you would like to use Nmood to continue.';
 }
 if(key==='interests'&&(!Array.isArray(data.interests)||data.interests.length<3||data.interests.length>5))return 'Choose between 3 and 5 interests.';
 if(key==='looking_for'&&!normalizeLookingForTags(data.looking_for_tags).length)return 'Choose what you are looking for.';
 if(key==='languages'&&(!Array.isArray(data.languages)||!data.languages.length))return 'Choose at least one language.';
 if(key==='location'&&(!data.country?.trim()||!data.city?.trim()))return 'Choose your country and enter your city.';
 return '';
}
export function completionIssue(data,reviewed, steps = ONBOARDING_STEPS) {
 const missing=steps.slice(0,-1).find((step,index)=>reviewed?.[index]!==step.key);
 if(missing)return {key:missing.key,message:'Please review each step before finishing.'};
 for(const step of steps){const message=stepValidation(step.key,data);if(message)return {key:step.key,message};}
 return null;
}
