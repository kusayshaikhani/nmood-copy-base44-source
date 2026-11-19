// Fixed owner-device states only. Never accept payloads, identifiers or errors.
const allowed = new Set(['retained_signal','never_shared','checking','ready','sharing_off','permission_missing','no_fresh_signal','signal_accepted','refresh_failed','foreground_unavailable','background','permission_granted','capture_started','capture_received','capture_timeout','services_disabled','fix_rejected','publish_started','publish_rejected','preferences_unavailable']);
let snapshot={foreground:'checking',presence:'no_fresh_signal',location:'no_fresh_signal'};
const listeners=new Set();
export const subscribeIndicatorDiagnostics=fn=>{listeners.add(fn);return()=>listeners.delete(fn);};
export const getIndicatorDiagnostics=()=>snapshot;
export function setIndicatorDiagnostic(stage,state){
 if(!['foreground','presence','location','permission','capture','publish','freshness'].includes(stage)||!allowed.has(state))return;
 snapshot={...snapshot,[stage]:state};listeners.forEach(fn=>fn());
}
export function resetIndicatorDiagnostics(){snapshot={foreground:'checking',presence:'no_fresh_signal',location:'no_fresh_signal'};listeners.forEach(fn=>fn());}
export const INDICATOR_STATE_LABELS={retained_signal:'Last shared approximate location retained',never_shared:'No approximate location has been shared',permission_granted:'Permission granted',capture_started:'Obtaining device signal',capture_received:'Device signal received',capture_timeout:'Device signal timed out',services_disabled:'Device location services unavailable',fix_rejected:'Device signal failed freshness/accuracy validation',publish_started:'Publishing approximate signal',publish_rejected:'Server did not accept signal',preferences_unavailable:'Could not read saved consent',checking:'Checking',ready:'Foreground ready',sharing_off:'Sharing off',permission_missing:'Permission missing',no_fresh_signal:'No fresh signal confirmed',signal_accepted:'Signal accepted by server',refresh_failed:'Refresh failed — retry',foreground_unavailable:'Foreground state unavailable — retry',background:'App not foregrounded'};
