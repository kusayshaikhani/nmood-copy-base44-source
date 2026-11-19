import {setIndicatorDiagnostic} from './member-indicator-diagnostics';
// Foreground/activity only. No timer or background heartbeat in this collector.
export function createMemberIndicatorController({ rpc, locate, ownerId, currentOwner, storage, now = Date.now, automaticLocation = false, onLocationPublished = () => {} }) {
 let prefs=null,foreground=false,stopped=false,busy=false,revision=0,lastPresence=-Infinity;
 let idle=Promise.resolve(),finishActivity,locationRevision=0;
 let automaticPending=null,automaticRevision=-1,automaticRerun=false,automaticRegrant=false,lastAutomaticAttempt=-Infinity,lastAutomaticSuccess=-Infinity,automaticFailed=false;
 let abort=new AbortController();
 const permissionRevokeKey=`nmood:location-permission-withdrawal:${ownerId}`;
 const revokeKey=`nmood:indicator-revocation:${ownerId}`;
 const pending=()=>{try{return JSON.parse(storage.getItem(revokeKey)||'null');}catch{return {distance:false,presence:false,calculation:false};}};
 const stop=()=>{stopped=true;revision++;abort.abort();};
 const valid=version=>!stopped&&foreground&&version===revision&&currentOwner()===ownerId;
 async function activity({allowPrompt=false,forceLocation=false}={}) {
  if(busy&&forceLocation)await idle;
  if(busy||!foreground||stopped||!prefs||currentOwner()!==ownerId)return;
  busy=true;idle=new Promise(resolve=>{finishActivity=resolve;});const version=revision;let presenceError;
  try{
   if(prefs.presence_enabled&&now()-lastPresence>=30000){
    try { const result=await rpc('nmood_refresh_my_foreground_presence',{p_consent_revision:prefs.consent_revision},abort.signal);
     if(result?.accepted!==true)throw new Error('Signal not confirmed');
     if(valid(version)){lastPresence=now();setIndicatorDiagnostic('presence','signal_accepted');}
    } catch(error){presenceError=error;setIndicatorDiagnostic('presence','refresh_failed');}
   }
   if(!valid(version))return;
   if((prefs.distance_enabled||prefs.distance_calculation_enabled)&&(forceLocation||((allowPrompt||!automaticLocation)&&!prefs.location_current))){
    const current=await rpc('nmood_get_my_indicator_preferences',{},abort.signal);
    if(!valid(version))return;
    prefs=current;
    if((!prefs?.distance_enabled&&!prefs?.distance_calculation_enabled)||(!forceLocation&&prefs.location_current))return;
    let cell;try{cell=await locate({allowPrompt,signal:abort.signal});}catch(error){if(error?.indicatorState==='permission_denied' && automaticLocation && valid(version)){storage.setItem(permissionRevokeKey,'explicit-denial');prefs={...prefs,location_current:false,location_available:false};onLocationPublished();await rpc('nmood_withdraw_my_coarse_location',{},abort.signal);storage.removeItem(permissionRevokeKey);prefs={...prefs,location_current:false,location_available:false};onLocationPublished();}else setIndicatorDiagnostic('location','refresh_failed');throw error;}
    if(!valid(version)){cell=null;return;}
    try{
     setIndicatorDiagnostic('publish','publish_started');
     const result=await rpc('nmood_refresh_my_coarse_location',{p_cell:cell,p_consent_revision:prefs.consent_revision},abort.signal);
     if(result?.accepted!==true)throw new Error('Signal not confirmed');
     if(valid(version)){setIndicatorDiagnostic('publish','signal_accepted');setIndicatorDiagnostic('freshness','signal_accepted');locationRevision++;prefs={...prefs,location_current:true,location_available:true};setIndicatorDiagnostic('location','signal_accepted');onLocationPublished({authorizedRefresh:true});}
    }catch(error){setIndicatorDiagnostic('publish','publish_rejected');setIndicatorDiagnostic('location','refresh_failed');throw error;}finally{cell=null;}
   }
   if(presenceError)throw presenceError;
  }finally{busy=false;finishActivity?.();}
 }
 async function load(){
  const version=revision,loadedLocationRevision=locationRevision;
  if(automaticLocation && storage.getItem(permissionRevokeKey)){
   // Legacy 'pending' could mean not determined, not an actual revocation.
   // Only new explicit-denial records are safe to replay after a failed RPC.
   if(storage.getItem(permissionRevokeKey)==='explicit-denial')await rpc('nmood_withdraw_my_coarse_location',{},abort.signal);
   storage.removeItem(permissionRevokeKey);
  }
  const saved=pending();
  if(saved){await rpc('nmood_set_my_indicator_consent',{p_distance:saved.distance??null,p_presence:saved.presence??null,p_distance_calculation:saved.calculation??null});storage.removeItem(revokeKey);}
  let next;try { next=await rpc('nmood_get_my_indicator_preferences',{},abort.signal); } catch(error) {setIndicatorDiagnostic('freshness','preferences_unavailable');throw error;}
  if(version===revision&&currentOwner()===ownerId&&loadedLocationRevision!==locationRevision)return prefs;
  if(version===revision&&currentOwner()===ownerId){prefs=next;stopped=false;setIndicatorDiagnostic('location',next?.distance_enabled?(next.location_current?'signal_accepted':next.location_available?'retained_signal':'never_shared'):'sharing_off');setIndicatorDiagnostic('presence',next?.presence_enabled?'no_fresh_signal':'sharing_off');}
  return version===revision&&currentOwner()===ownerId?next:null;
 }
 async function setConsent(patch){
  stop();
  const revoke={};if(patch.distance===false){revoke.distance=false;setIndicatorDiagnostic('location','sharing_off');}if(patch.presence===false){revoke.presence=false;setIndicatorDiagnostic('presence','sharing_off');}if(patch.calculation===false)revoke.calculation=false;
  if(Object.keys(revoke).length)storage.setItem(revokeKey,JSON.stringify({...pending(),...revoke}));
  abort=new AbortController();
  const version=revision;
  // Never collect if saving consent failed. A pending local revoke survives reload.
  const next=await rpc('nmood_set_my_indicator_consent',{p_distance:patch.distance??null,p_presence:patch.presence??null,p_distance_calculation:patch.calculation??null},abort.signal);
  if(currentOwner()!==ownerId||version!==revision)return null;
  storage.removeItem(revokeKey);prefs=next;stopped=false;lastPresence=-Infinity;lastAutomaticAttempt=-Infinity;lastAutomaticSuccess=-Infinity;
  return next;
 }
 function setForeground(active){
  if(active&&!foreground){lastAutomaticAttempt=-Infinity;lastAutomaticSuccess=-Infinity;}
  foreground=active;
  if(!active){revision++;abort.abort();abort=new AbortController();}
 }
 // Main-only foreground refresh. Native runtime may request first device
 // permission after this controller verifies saved consent. Never enable consent.
 // Coalesce native/document/consent events and honor the server's five-minute floor.
 function refreshAutomaticLocation({permissionGranted=false,retryFailed=false}={}){
  if(automaticPending){
   // A resume/regrant is newer work, not a duplicate of an aborted capture.
   if(foreground&&!stopped&&currentOwner()===ownerId&&(automaticRevision!==revision||permissionGranted)){
    automaticRerun=true;automaticRegrant=automaticRegrant||permissionGranted;
   }
   return automaticPending;
  }
  if(!automaticLocation||!foreground||stopped||currentOwner()!==ownerId)return Promise.resolve();
  const time=now();
  if(!permissionGranted&&(time-lastAutomaticSuccess<300000||(!(retryFailed&&automaticFailed)&&time-lastAutomaticAttempt<300000)))return Promise.resolve();
  automaticFailed=false;automaticRevision=revision;
  const startingLocationRevision=locationRevision,startingRevision=revision;
  const finish=async error=>{
   automaticPending=null;
   const rerun=automaticRerun,regrant=automaticRegrant;automaticRerun=false;automaticRegrant=false;
   if(rerun&&foreground&&!stopped&&currentOwner()===ownerId&&(startingRevision!==revision||startingLocationRevision===locationRevision)){
    lastAutomaticAttempt=-Infinity;lastAutomaticSuccess=-Infinity;
    return refreshAutomaticLocation({permissionGranted:regrant});
   }
   if(error){automaticFailed=true;throw error;}
  };
  automaticPending=(async()=>{
   await idle;
   if(!foreground||stopped||currentOwner()!==ownerId)return;
   const version=revision;
   await load();
   if(!valid(version)||(!prefs?.distance_enabled&&!prefs?.distance_calculation_enabled))return;
   lastAutomaticAttempt=now();const before=locationRevision;
   try{
    await activity({allowPrompt:false,forceLocation:true});
   }finally{
    if(valid(version)&&locationRevision>before)lastAutomaticSuccess=now();
    if(!valid(version))lastAutomaticAttempt=-Infinity;
   }
  })().then(()=>finish(),error=>finish(error));
  return automaticPending;
 }
 async function refreshLocation(){
  await idle;
  if(!foreground||stopped||currentOwner()!==ownerId)throw new Error('Foreground refresh unavailable');
  await load();
  if(!prefs?.distance_enabled&&!prefs?.distance_calculation_enabled)throw new Error('Location consent required');
  const before=locationRevision;
  await activity({allowPrompt:true,forceLocation:true});
  if(locationRevision===before)throw new Error('Fresh location not confirmed');
  if(!foreground||stopped||currentOwner()!==ownerId)throw new Error('Foreground refresh interrupted');
  const next=await load();
  if(next?.location_current!==true)throw new Error('Fresh location not confirmed');
  return next;
 }
 return {activity,refreshLocation,refreshAutomaticLocation,load,setConsent,setForeground,stop,getPreferences:()=>prefs};
}
