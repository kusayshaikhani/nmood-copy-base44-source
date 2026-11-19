import { Switch } from '@/components/ui/switch';
import ReviewedSettingsFields from './ReviewedSettingsFields';
import React, { useState } from 'react';
import { MAIN_PASSPORT } from '@/lib/passport/enabled';
import { getOnboardingSettings } from '@/lib/onboarding-settings';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import LocalProfileChoice from '@/components/profile/LocalProfileChoice';

export const PRIVACY_CHOICES = [
 {key:'profile_visibility',label:'Profile visibility',fallback:'public',options:[['public','Public'],['connections','My Pals'],['private','Private']]},
 {key:'who_can_message',label:'Who can message me',fallback:'everyone',options:[['everyone','Everyone'],['connections','My Pals'],['no_one','No one']]},
];

export default function PrivacyStep({data,update,onNext}) {
 const {user}=useAuth();
 const [saving,setSaving]=useState(false),[error,setError]=useState('');
 const distanceEnabled=data.indicator_distance_consent===true;
 const activityEnabled=data.show_online_status!==false;
 const locationReady=data.location_enabled===true;
 const setDistance=value=>update({show_distance:value,indicator_distance_consent:value,indicator_distance_calculation:value&&locationReady});
 const setActivity=value=>update({show_online_status:value,show_last_seen:value,indicator_presence_consent:value});
 const notNow=()=>update({show_distance:false,indicator_distance_consent:false,indicator_distance_calculation:false,show_online_status:false,show_last_seen:false,indicator_presence_consent:false});
 const continueWithChoices=async()=>{
  if(saving)return;
  setSaving(true);setError('');
  try {
  let defaultPatch={};
  if(MAIN_PASSPORT && data.onboarding_completed===false && !Object.hasOwn(data._settingsChanges||{},'profile_view_visibility')) {
   // Only an unset new-customer preference gets the default, after a fresh read.
   const saved=await getOnboardingSettings({expectedUserId:user?.id});
   if(saved.profile_view_visibility===null)defaultPatch={_settingsChanges:{...data._settingsChanges,profile_view_visibility:'visible'}};
  }
  const useDistance=distanceEnabled;
  const usePrivateCalculation=locationReady&&distanceEnabled;
  // Continue is the affirmative onboarding action. Keep the visible sharing
  // choices and their server-side consent in one draft/save operation.
  update({
   ...defaultPatch,
   show_distance:useDistance,
   indicator_distance_consent:useDistance,
   indicator_distance_calculation:usePrivateCalculation,
   show_online_status:activityEnabled,
   show_last_seen:activityEnabled,
   indicator_presence_consent:activityEnabled,
  });
  await onNext();
  } catch {setError('Privacy choices could not be confirmed. Please try again.');}
  finally {setSaving(false);}
 };
 return <div className="space-y-5">
  <p className="text-sm text-muted-foreground">Premium never overrides your field sharing choices. Date of birth, contact details and coordinates are not public profile fields. Blocking still applies.</p>
  <section aria-labelledby="onboarding-connection-signals" className="space-y-3 rounded-xl border bg-card p-4">
   <h2 id="onboarding-connection-signals" className="text-base font-semibold">How do you want to appear to people?</h2>
   <label className="flex min-h-11 items-start justify-between gap-3 rounded-lg border p-3">
    <span><span className="block text-sm font-medium">Share approximate distance</span><span className="mt-1 block text-xs text-muted-foreground">Shows only a rounded distance, such as ~5 km away. Your exact location is never shared. People see your distance only when you choose to share it and authorized device location is available.</span></span>
    <Switch aria-label="Share approximate distance" checked={distanceEnabled} onCheckedChange={setDistance}/>
   </label>
   {!locationReady&&<p role="status" className="text-xs text-muted-foreground">Distance is hidden until usable device location is available. You can enable it later in Settings → Privacy → Distance and online status → Allow location and refresh distance.</p>}
   <label className="flex min-h-11 items-start justify-between gap-3 rounded-lg border p-3">
    <span><span className="block text-sm font-medium">Show activity status</span><span className="mt-1 block text-xs text-muted-foreground">Lets people see whether you’re online or when you were last active.</span></span>
    <Switch aria-label="Show activity status" checked={activityEnabled} onCheckedChange={setActivity}/>
   </label>
   <Button type="button" variant="outline" className="min-h-11 w-full" onClick={notNow}>Not now</Button>
  </section>
  {PRIVACY_CHOICES.map(field=><div key={field.key}>
   <LocalProfileChoice label={field.label} value={data[field.key]??field.fallback} options={field.options.map(([value,label])=>({value,label}))} onChange={value=>update({[field.key]:value})}/>
  </div>)}
  <p className="text-xs text-muted-foreground">Personal details are optional. Newly selected values are included only where the existing profile privacy rules allow. You can manage stored sharing preferences in Edit Profile.</p>
  <ReviewedSettingsFields data={data} update={update} step="privacy"/>
  <p className="text-xs text-muted-foreground">You can change these anytime in Settings.</p>
  {error&&<p role="alert">{error}</p>}
  <Button disabled={saving} className="w-full h-12" onClick={continueWithChoices}>Continue</Button>
 </div>;
}
