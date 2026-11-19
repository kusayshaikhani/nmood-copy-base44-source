import {LOCATION_PERMISSION_GRANTED} from './location-permission-event';
import {MAIN_PASSPORT} from './passport/enabled';
import {setIndicatorDiagnostic} from './member-indicator-diagnostics';
import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { MEMBER_INDICATORS_ENABLED } from './member-indicator-config';
import { getMemberIndicatorRuntime, clearMemberIndicatorRuntime, setIndicatorForeground } from './member-indicator-runtime';
export function useMemberIndicatorActivity(ownerId){
 useEffect(()=>{
  if(!MEMBER_INDICATORS_ENABLED||!ownerId)return;
  const controller=getMemberIndicatorRuntime();if(!controller)return;
  let nativeVersion=0;
  let retryTimer,refreshGeneration=0;
  const cancelRefreshRetry=()=>{clearTimeout(retryTimer);refreshGeneration++;};
  let regionalReady=true;
  let active=true,nativeActive=!Capacitor.isNativePlatform(),subscription;
  const isForeground=()=>active&&regionalReady&&nativeActive&&document.visibilityState==='visible';
  // Two bounded retries recover startup/network/GPS races without a tap. Each
  // attempt rechecks consent and permission. Only a never-requested native
  // permission may prompt once, after server-confirmed consent.
  const refreshLocation=(options,attempt=0,generation=refreshGeneration)=>{
   if(!MAIN_PASSPORT||!isForeground())return;
   void controller.refreshAutomaticLocation(options).catch(error=>{
    if(generation!==refreshGeneration||!isForeground()||attempt>=2||['permission_denied','permission_unresolved'].includes(error?.indicatorState))return;
    clearTimeout(retryTimer);
    retryTimer=setTimeout(()=>refreshLocation({retryFailed:true},attempt+1,generation),attempt===0?2000:8000);
   });
  };
  const activity=()=>{controller.setForeground(isForeground());if(isForeground())void controller.activity({allowPrompt:!MAIN_PASSPORT}).catch(()=>{});};
  const foreground=()=>{
   if(!active)return;
   cancelRefreshRetry();
   setIndicatorForeground(isForeground());setIndicatorDiagnostic('foreground',isForeground()?'ready':'background');
   controller.setForeground(isForeground());
   if(isForeground()){
    void controller.load().then(activity).catch(()=>{});
    if(MAIN_PASSPORT)refreshLocation();
   }
  };
  const retry=()=>{if(Capacitor.isNativePlatform())void App.getState().then(s=>{if(active){nativeVersion++;nativeActive=s.isActive;foreground();}}).catch(()=>setIndicatorDiagnostic('foreground','foreground_unavailable'));else foreground();};
  const withdrawRegion=()=>{cancelRefreshRetry();regionalReady=false;controller.setForeground(false);setIndicatorForeground(false);};
  const confirmRegion=()=>{regionalReady=true;if(MAIN_PASSPORT)foreground();else {controller.setForeground(isForeground());setIndicatorForeground(isForeground());if(isForeground())void controller.load().catch(()=>{});}};
  const permissionGranted=()=>{if(MAIN_PASSPORT&&isForeground()){cancelRefreshRetry();refreshLocation({permissionGranted:true});}};
  window.addEventListener(LOCATION_PERMISSION_GRANTED,permissionGranted);
  window.addEventListener('nmood:region-visibility-withdrawn',withdrawRegion);
  window.addEventListener('nmood:region-visibility-confirmed',confirmRegion);
  window.addEventListener('nmood:retry-indicator-foreground',retry);
  document.addEventListener('visibilitychange',foreground);
  document.addEventListener('pointerdown',activity,{passive:true});document.addEventListener('keydown',activity);
  if(Capacitor.isNativePlatform()){
   const initialVersion=nativeVersion;
   App.getState().then(s=>{if(active&&initialVersion===nativeVersion){nativeActive=s.isActive;foreground();}}).catch(()=>{if(active)setIndicatorDiagnostic('foreground','foreground_unavailable');});
   App.addListener('appStateChange',s=>{if(!active)return;nativeVersion++;nativeActive=s.isActive;foreground();}).then(handle=>{if(active)subscription=handle;else handle.remove();}).catch(()=>{});
  }else foreground();
  return()=>{cancelRefreshRetry();window.removeEventListener(LOCATION_PERMISSION_GRANTED,permissionGranted);window.removeEventListener('nmood:region-visibility-withdrawn',withdrawRegion);window.removeEventListener('nmood:region-visibility-confirmed',confirmRegion);window.removeEventListener('nmood:retry-indicator-foreground',retry);active=false;setIndicatorForeground(false);subscription?.remove();document.removeEventListener('visibilitychange',foreground);document.removeEventListener('pointerdown',activity);document.removeEventListener('keydown',activity);clearMemberIndicatorRuntime(controller);};
 },[ownerId]);
}
