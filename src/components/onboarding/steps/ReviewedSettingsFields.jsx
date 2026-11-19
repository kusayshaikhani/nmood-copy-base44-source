import { MAIN_PASSPORT } from '@/lib/passport/enabled';
import React,{useEffect,useState} from 'react';
import {getOnboardingSettings,SETTINGS_BY_STEP} from '@/lib/onboarding-settings';
import LocalProfileChoice from '@/components/profile/LocalProfileChoice';
import {useAuth} from '@/lib/AuthContext';
const labels={profile_view_visibility:'Profile View Visibility',notif_email:'Email notifications',notif_circle:'Circle push notifications',personalized_recommendations:'Personalized recommendations',analytics_consent:'Optional product analytics',notifications_enabled:'Push notifications'};
export default function ReviewedSettingsFields({data,update,step}) {
 const {user}=useAuth();const [saved,setSaved]=useState(null),[error,setError]=useState(false),[attempt,setAttempt]=useState(0);
 useEffect(()=>{
  let active=true;const controller=new AbortController();setSaved(null);setError(false);
  getOnboardingSettings({expectedUserId:user?.id,signal:controller.signal}).then(value=>{if(active)setSaved(value);}).catch(()=>{if(active)setError(true);});
  return()=>{active=false;controller.abort();};
 },[user?.id,attempt]);
 return <section className="space-y-4" aria-label="Optional saved settings">
  <p className="text-sm">Leave a field on Keep current to preserve its saved choice. A new choice is saved only when you Continue.</p>
  {!saved&&!error&&<p role="status">Loading saved settings…</p>}
  {error&&<div role="alert"><p>Saved settings are unavailable. Retry before choosing, or Continue without changing them.</p><button className="min-h-11 rounded-xl border px-4" type="button" onClick={()=>setAttempt(value=>value+1)}>Retry settings</button></div>}
  {SETTINGS_BY_STEP[step].map(key=>{
   const pending=data._settingsChanges||{};
   const mainVisibility=MAIN_PASSPORT && key==='profile_view_visibility';
   const defaultVisible=mainVisibility && saved?.[key]===null && data.onboarding_completed===false;
   const selected=Object.hasOwn(pending,key)?String(pending[key]):mainVisibility?(saved?.[key] || (defaultVisible?'visible':'')):'';
   const current=saved?.[key];const description=!saved?'unavailable':current===null?'not set':typeof current==='boolean'?(current?'enabled':'disabled'):current==='visible'?'Visible':'Private Browsing';
   const options=[{value:'',label:`Keep current (${description})`},...(key==='profile_view_visibility'?[{value:'visible',label:mainVisibility?'Public':'Visible'},{value:'private',label:'Private Browsing'}]:[{value:'true',label:'Enable'},{value:'false',label:'Disable'}])];
   return <fieldset key={key} disabled={!saved} className="space-y-2"><legend>{labels[key]}</legend>
    <LocalProfileChoice label={labels[key]} value={selected} options={options} onChange={value=>{
     const next={...pending};if(value==='')delete next[key];else next[key]=key==='profile_view_visibility'?value:value==='true';
     update({_settingsChanges:next});
    }}/>
    {Object.hasOwn(pending,key)&&selected&&<span className="block text-xs">Pending choice — not saved yet.</span>}
   </fieldset>;
  })}
  {step==='privacy'&&<p className="text-xs">Private Browsing hides your visits and your own Profile Views list. Analytics is optional; completing onboarding does not grant consent.</p>}
 </section>;
}
