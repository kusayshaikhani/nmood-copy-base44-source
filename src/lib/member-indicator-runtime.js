import {locationPermissionState} from './location-permission-state';
import {MAIN_PASSPORT} from './passport/enabled';
import {setIndicatorDiagnostic,resetIndicatorDiagnostics} from './member-indicator-diagnostics';
import {coarseCellFromPosition,freshCoarseCellFromPosition,validateIndicatorRequest,indicatorFailure} from './member-indicator-transport';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import { callSupabaseRpc, getSupabaseSession } from '@/api/supabaseClient';
import { createMemberIndicatorController } from './member-indicator-controller';
import { MEMBER_INDICATORS_ENABLED } from './member-indicator-config';
import { withTimeout } from './bounded-operation';
// Only an explicit denied result establishes revocation. Prompt/unknown states
// and failed OS checks must never destroy a previously consented coarse signal.
function requireLocationPermission(permission) {
 if(locationPermissionState(permission)==='granted')return;
 const error=new Error('Location permission unresolved');
 error.indicatorState=locationPermissionState(permission)==='denied'?'permission_denied':'permission_unresolved';
 throw error;
}
let active;
export const INDICATORS_CHANGED='nmood:member-indicators-changed';
export function clearMemberIndicatorRuntime(expected){if(expected&&active?.controller!==expected)return;active?.controller.stop();active=null;resetIndicatorDiagnostics();}
export function getMemberIndicatorRuntime(){
 if(!MEMBER_INDICATORS_ENABLED)return null;
 const ownerId=getSupabaseSession()?.user?.id;if(!ownerId){clearMemberIndicatorRuntime();return null;}
 if(active?.ownerId===ownerId)return active.controller;
 clearMemberIndicatorRuntime();
 // Server consent is checked by the controller before locate is called. A
 // returning account may still need this installation's first OS permission.
 // Never repeatedly prompt after dismissal, denial, or an unknown OS state.
 let initialPermissionRequested=false;
 const controller=createMemberIndicatorController({automaticLocation:MAIN_PASSPORT,onLocationPublished:detail=>window.dispatchEvent(new CustomEvent(INDICATORS_CHANGED,{detail})),ownerId,currentOwner:()=>getSupabaseSession()?.user?.id,storage:localStorage,
  rpc:async(name,args,signal)=>{try{return await withTimeout(inner=>callSupabaseRpc(name,validateIndicatorRequest(name,args),{signal:signal||inner,expectedUserId:ownerId}));}catch{throw indicatorFailure();}},
  locate:async({allowPrompt,signal})=>{
   let position;
   try{
   if(signal.aborted)throw new Error('Location cancelled');
   if(MAIN_PASSPORT&&allowPrompt&&Capacitor.isNativePlatform()){
    let permission=await Geolocation.checkPermissions();
    if(permission.location!=='granted'&&permission.coarseLocation!=='granted')permission=await Geolocation.requestPermissions({permissions:['location']});
    requireLocationPermission(permission);
    // Explicit device opt-in must retry display even if the following GPS fix
    // fails: the server may already hold an authorized last-shared location.
    window.dispatchEvent(new Event(INDICATORS_CHANGED));
   }
   if(!allowPrompt){
    let permission=Capacitor.isNativePlatform()?await Geolocation.checkPermissions():await navigator.permissions.query({name:'geolocation'}).then(p=>({location:p.state}));
    if(signal.aborted||getSupabaseSession()?.user?.id!==ownerId)throw new Error('Location cancelled');
    if(MAIN_PASSPORT&&Capacitor.isNativePlatform()&&!initialPermissionRequested&&locationPermissionState(permission)!=='granted'&&permission?.location==='prompt'&&(!permission.coarseLocation||permission.coarseLocation==='prompt')){
     initialPermissionRequested=true;
     permission=await Geolocation.requestPermissions({permissions:['location']});
     if(signal.aborted||getSupabaseSession()?.user?.id!==ownerId)throw new Error('Location cancelled');
     requireLocationPermission(permission);
     window.dispatchEvent(new Event(INDICATORS_CHANGED));
    }
    requireLocationPermission(permission);
   }
   setIndicatorDiagnostic('permission','permission_granted');
   setIndicatorDiagnostic('capture','capture_started');
   position=await withTimeout(()=>Geolocation.getCurrentPosition({enableHighAccuracy:false,timeout:10000,maximumAge:0}),12000);
   if(signal.aborted)throw new Error('Location cancelled');
   setIndicatorDiagnostic('capture','capture_received');
   try{return MAIN_PASSPORT?freshCoarseCellFromPosition(position):coarseCellFromPosition(position);}catch{setIndicatorDiagnostic('freshness','fix_rejected');throw indicatorFailure();}
   }catch(error){const failure=indicatorFailure();
    if(error?.indicatorState==='permission_denied'||error?.code===1||error?.code==='OS-PLUG-GLOC-0003'){setIndicatorDiagnostic('permission','permission_missing');setIndicatorDiagnostic('location','permission_missing');failure.indicatorState='permission_denied';}
    if(error?.indicatorState==='permission_unresolved')failure.indicatorState='permission_unresolved';
    if(error?.code==='OS-PLUG-GLOC-0010'||error?.code===3)setIndicatorDiagnostic('capture','capture_timeout');
    if(error?.code==='OS-PLUG-GLOC-0007')setIndicatorDiagnostic('capture','services_disabled');
    throw failure;}finally{position=null;}
  }});
 active={ownerId,controller};return controller;
}

let foreground=false;
const foregroundListeners=new Set();
export const subscribeIndicatorForeground=listener=>{foregroundListeners.add(listener);return()=>foregroundListeners.delete(listener);};
export const getIndicatorForeground=()=>foreground;
export const setIndicatorForeground=value=>{foreground=value;foregroundListeners.forEach(listener=>listener());};


// Profile/onboarding sharing toggles and explicit consent are separate. A true
// sharing toggle never opts a member in; only these explicit consent values do.
export async function persistExplicitMemberIndicatorConsent({distance, presence, calculation} = {}, requestOptions) {
 if(!MEMBER_INDICATORS_ENABLED)return null;
 const patch={};
 if(typeof distance==='boolean')patch.distance=distance;
 if(typeof presence==='boolean')patch.presence=presence;
 if(typeof calculation==='boolean')patch.calculation=calculation;
 if(!Object.keys(patch).length)return null;
 const controller=getMemberIndicatorRuntime();
 const result=controller
  ? await controller.setConsent(patch)
  : await callSupabaseRpc('nmood_set_my_indicator_consent',{p_distance:patch.distance??null,p_presence:patch.presence??null,p_distance_calculation:patch.calculation??null},requestOptions);
 // A member may opt in while the app is already foregrounded. Start a single
 // foreground-only refresh after the server has confirmed consent; this never
 // sends a location before consent succeeds and does not block Profile Save.
 if(controller&&(patch.distance===true||patch.presence===true||patch.calculation===true)){
  void Promise.resolve(MAIN_PASSPORT ? controller.refreshAutomaticLocation() : controller.activity({allowPrompt:patch.distance===true||patch.calculation===true})).catch(()=>{});
 }
 window.dispatchEvent(new Event(INDICATORS_CHANGED));
 return result;
}

// Legacy privacy controls may revoke consent, but can never opt members in.
export async function revokeMemberIndicatorsForProfilePatch(fields) {
 if(!MEMBER_INDICATORS_ENABLED)return;
 const patch={};
 if(fields?.show_distance===false||fields?.location_enabled===false)patch.distance=false;
 if(fields?.show_online_status===false)patch.presence=false;
 if(!Object.keys(patch).length)return;
 const controller=getMemberIndicatorRuntime();
 if(!controller)return;
 window.dispatchEvent(new Event(INDICATORS_CHANGED));
 await controller.setConsent(patch);
}
