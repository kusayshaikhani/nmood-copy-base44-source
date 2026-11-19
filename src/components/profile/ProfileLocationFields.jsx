import {requestOnboardingLocationPermission} from '@/lib/onboarding-location-permission';
import { Button } from '@/components/ui/button';
import { MAIN_PASSPORT } from '@/lib/passport/enabled';
import React, { useState, useRef, useEffect } from 'react';
import { withTimeout } from '@/lib/bounded-operation';
import { PROFILE_FIELD_CLASS } from './profile-field-style';
import NativeProfileSelect from './NativeProfileSelect';
import { Input } from '@/components/ui/input';
import { COUNTRIES } from '@/lib/master-data';
import { requestNmoodLocation } from '@/lib/nmood-location';
import { Capacitor } from '@capacitor/core';
import { detectLocation, hasGrantedLocationPermission, locationFailureMessage } from '@/lib/location-detection';
export function resolveSavedLocation(city,country) {
 const match=COUNTRIES.find(item=>[item.key,item.iso2,item.name].some(value=>String(value||'').toLowerCase()===String(country||'').toLowerCase()));
 return {city:String(city||'').trim(),country:match?.name||''};
}
export default function ProfileLocationFields({data,update,errors={}, onboarding = false}) {
 const [selection,setSelection]=useState(null);
 const [detecting,setDetecting]=useState(false),[error,setError]=useState('');
 const mounted=useRef(true),revision=useRef(0), started=useRef(false), inFlight=useRef(false);
 const androidDiscoveryLocation=Capacitor.getPlatform?.()==='android';
 const change=patch=>{revision.current++;update(patch);};
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
 const confirmDeviceLocation=async()=>{
  if(inFlight.current)return;setSelection('automatic');started.current=true;inFlight.current=true;const version=revision.current;setDetecting(true);setError('');
  try {
   if(onboarding&&MAIN_PASSPORT&&!(await requestOnboardingLocationPermission())){
    if(mounted.current&&version===revision.current){setError('Location access is off. You can still choose your country and city manually.');update({location_enabled:false,indicator_distance_calculation:false});}
    return;
   }
   if(!mounted.current||version!==revision.current)return;
   if(androidDiscoveryLocation){
    const detected=await withTimeout(()=>detectLocation({fresh:true}), onboarding&&MAIN_PASSPORT?32000:17000);
    if(detected?.source!=='gps'||!detected.country||!detected.city)throw Object.assign(new Error('Location could not be detected.'),{errorType:detected?.errorType});
    if(!mounted.current||version!==revision.current)return;
    update({country:detected.country,country_code:detected.countryCode,city:detected.city,state:detected.state||'',latitude:null,longitude:null,location_enabled:true,...(onboarding ? {indicator_distance_calculation:true} : {})});
   }else{
    await withTimeout(()=>requestNmoodLocation(), onboarding&&MAIN_PASSPORT?30000:15000);
    if(!mounted.current||version!==revision.current)return;
    update({location_enabled:true, ...(onboarding ? {indicator_distance_calculation:true} : {})});
   }
  } catch (failure) {if(mounted.current&&version===revision.current){setError(androidDiscoveryLocation?locationFailureMessage(failure?.errorType):'Location could not be confirmed. Your saved country and city were not changed.');if(onboarding)update({location_enabled:false,indicator_distance_calculation:false});}}
  finally {inFlight.current=false;if(mounted.current)setDetecting(false);}
 };
 useEffect(()=>{
  // Android refreshes from the device only after permission has already been
  // granted. New users still choose the existing action before Android asks.
  if(!onboarding||!MAIN_PASSPORT||!androidDiscoveryLocation||started.current)return undefined;
  let cancelled=false;
  hasGrantedLocationPermission().then(granted=>{if(granted&&!cancelled)void confirmDeviceLocation();}).catch(()=>{});
  return()=>{cancelled=true;};
 },[onboarding,androidDiscoveryLocation]);
 const country=resolveSavedLocation(data.city,data.country).country;
 return <section aria-label={onboarding && MAIN_PASSPORT ? "Find your local Nmood" : "Where you live"} className="space-y-3">
  <p className="text-sm text-muted-foreground">Country and city are your discovery location. Device location is optional and is used only for approximate distance; it never changes these fields.</p>
  {onboarding && MAIN_PASSPORT && <div className="flex flex-wrap gap-3">
   <Button type="button" aria-pressed={selection==='automatic'} className={`min-h-12 flex-1 px-4 ${selection==='automatic'?'ring-2 ring-primary ring-offset-2':''}`} disabled={detecting} onClick={confirmDeviceLocation}>{detecting?'Checking location…':androidDiscoveryLocation?'Detect my location':'Use device location for distance'}</Button>
   <Button type="button" aria-pressed={selection==='manual'} className={`min-h-12 flex-1 px-4 ${selection==='manual'?'ring-2 ring-primary ring-offset-2':''}`} onClick={()=>{revision.current++;started.current=true;setSelection('manual');document.getElementById('profile-country')?.focus();}}>Choose manually</Button>
  </div>}
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
   <div id="edit-section-country" className="min-w-0 space-y-1.5"><label className="text-sm font-medium leading-none" htmlFor="profile-country">Country</label>
    <NativeProfileSelect id="profile-country" value={country} path="PROFILE-COUNTRY" options={COUNTRIES.map(item=>({value:item.name,label:item.name}))} placeholder="Choose country" className={PROFILE_FIELD_CLASS} onChange={value=>change({country:value,...(MAIN_PASSPORT ? {country_code:COUNTRIES.find(c=>c.name===value)?.iso2 || null,city:''} : {})})}/>
    {errors.country&&<p>{errors.country}</p>}
   </div>
   <div id="edit-section-city" className="min-w-0 space-y-1.5"><label className="text-sm font-medium leading-none" htmlFor="profile-city">City</label><Input className={PROFILE_FIELD_CLASS} id="profile-city" value={data.city||''} maxLength={60} onChange={event=>change({city:event.target.value})}/>
    {errors.city&&<p>{errors.city}</p>}
   </div>
  </div>
  {!(onboarding && MAIN_PASSPORT) && <button type="button" className="min-h-11 rounded-xl border px-4" disabled={detecting} onClick={confirmDeviceLocation}>{detecting?'Checking location…':androidDiscoveryLocation?'Detect my location':'Use device location for distance'}</button>}
  <label className="flex min-h-11 items-center gap-3"><input type="checkbox" checked={data.location_enabled===true} onChange={event=>{if(event.target.checked)void confirmDeviceLocation();else change({location_enabled:false});}}/>Use location services for approximate distance (does not change country or city)</label>
  {error&&<p role="alert" className="text-sm">{error}</p>}
  {onboarding&&<p className="text-xs text-muted-foreground">You can enable location later in Settings → Privacy → Distance and online status. Turn on Share approximate distance if you want to share, then tap Allow location and refresh distance.</p>}
 </section>;
}
