import { MAIN_PASSPORT } from '@/lib/passport/enabled';
import { MapPin } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {subscribeIndicatorDiagnostics,getIndicatorDiagnostics,INDICATOR_STATE_LABELS} from '@/lib/member-indicator-diagnostics';
import React, {useEffect,useState,useRef,useSyncExternalStore} from 'react';
import { MEMBER_INDICATORS_ENABLED } from '@/lib/member-indicator-config';
import {getMemberIndicatorRuntime,INDICATORS_CHANGED} from '@/lib/member-indicator-runtime';
export default function MemberIndicatorSettings(){
 const [prefs,setPrefs]=useState(null),[error,setError]=useState(''),[success,setSuccess]=useState(''),[busy,setBusy]=useState(false);
 const diagnostic=useSyncExternalStore(subscribeIndicatorDiagnostics,getIndicatorDiagnostics,getIndicatorDiagnostics);
 const lock=useRef(false);
 const load=async()=>{try{setPrefs(await getMemberIndicatorRuntime()?.load());setError('');}catch{setError('Could not load sharing settings. Please retry.');}};
 useEffect(()=>{if(MEMBER_INDICATORS_ENABLED)void load();},[]);
 if(!MEMBER_INDICATORS_ENABLED)return null;
 const save=async patch=>{
  if(lock.current)return;lock.current=true;setBusy(true);setError('');setSuccess('');
  // Immediately stop this device before waiting for the server.
  window.dispatchEvent(new Event(INDICATORS_CHANGED));
  try{const controller=getMemberIndicatorRuntime();setPrefs(await controller.setConsent(patch));
   if(patch.distance===true||patch.presence===true||patch.calculation===true){try{if(MAIN_PASSPORT&&(patch.distance===true||patch.calculation===true))await controller.refreshLocation();else await controller.activity({allowPrompt:patch.distance===true||patch.calculation===true});}catch{setError('Sharing consent was saved, but the foreground update failed. Check device permissions and your connection, then retry.');}}
  }catch{setError('Could not finish updating sharing. Updates are stopped on this device. Retry to confirm your settings on the server.');}
  finally{lock.current=false;setBusy(false);window.dispatchEvent(new Event(INDICATORS_CHANGED));}
 };
 return <section aria-label="Distance and online status" className="min-w-0 text-foreground">
  <header className="mb-2.5 flex items-center gap-2 px-2"><MapPin aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground"/><h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Distance and online status</h2></header>
  <Card className="min-w-0 space-y-5 rounded-card p-4">
  <p className="text-sm leading-relaxed text-muted-foreground">People can receive your indicators only when your profile is public or an existing connection permits the profile path. Your sharing choices, consent, eligibility, and blocks always apply.</p>
  <div className="space-y-3 border-t border-border/60 pt-5"><h3 className="text-sm font-medium">Approximate distance</h3>
  <p className="text-sm leading-relaxed text-muted-foreground">Enable distance sharing to convert your location on this device while Nmood is open. Only a coarse cell is sent; precise coordinates never enter the request. The server uses 5 km distance buckets. {MAIN_PASSPORT ? 'Your last shared approximate location remains until updated or sharing is withdrawn.' : 'The cell expires after 24 hours.'} Foreground refreshes require this consent to remain enabled.</p>
  <label className="flex min-h-11 items-center justify-between gap-4 text-sm font-medium leading-relaxed"><span>Share approximate distance</span><Switch aria-label="Share approximate distance" aria-describedby="approximate-distance-help" disabled={busy||!prefs} checked={prefs?.distance_enabled===true} onCheckedChange={value=>void save(MAIN_PASSPORT?{distance:value,calculation:value}:{distance:value})}/></label>

  <p id="approximate-distance-help" className="text-sm leading-relaxed text-muted-foreground">Nmood uses only an approximate distance and never shows your precise location.</p>
  </div><div className="space-y-3 border-t border-border/60 pt-5"><h3 className="text-sm font-medium">Online status</h3>
  <p className="text-sm leading-relaxed text-muted-foreground">Online status uses activity while Nmood is open. After two minutes, a rounded Last seen label is available only when your separate Last Seen sharing setting is enabled. Otherwise no status is shown. No background heartbeat.</p>
  <label className="flex min-h-11 items-center justify-between gap-4 text-sm font-medium leading-relaxed"><span>Show activity status</span><Switch aria-label="Show activity status" disabled={busy||!prefs} checked={prefs?.presence_enabled===true} onCheckedChange={value=>void save({presence:value})}/></label>
  </div>
  {(prefs?.distance_enabled||prefs?.distance_calculation_enabled)&&<><p className="text-sm text-muted-foreground">Allow location on this device to calculate authorized approximate distances. Your sharing choices stay unchanged.</p><button type="button" disabled={busy} className="min-h-11 text-left text-sm font-medium text-primary underline underline-offset-4" onClick={async()=>{
   if(lock.current)return;lock.current=true;setBusy(true);setError('');setSuccess('');
   try{const controller=getMemberIndicatorRuntime();if(!controller)throw new Error('Unavailable');if(prefs?.distance_calculation_enabled!==true)await controller.setConsent({calculation:true});setPrefs(await controller.refreshLocation());setSuccess('Device location confirmed. Authorized distances are refreshing.');window.dispatchEvent(new Event(INDICATORS_CHANGED));}
   catch{setError('Could not confirm a fresh location. Keep Nmood open, allow location in this device’s Settings, then tap Allow location and refresh distance.');}
   finally{lock.current=false;setBusy(false);}
  }}>{busy?'Checking device location…':'Allow location and refresh distance'}</button></>}
  <details className="space-y-3 border-t border-border/60 pt-4 text-sm leading-relaxed text-muted-foreground"><summary className="min-h-11 cursor-pointer font-medium text-foreground">Indicator diagnostics (this device only)</summary>
   <p>Build: {import.meta.env.VITE_BUILD_REVISION || 'development'} · Consent required</p>
   {Object.entries(diagnostic).map(([stage,state])=><p key={stage}>{stage}: {INDICATOR_STATE_LABELS[state]}</p>)}
   <p>Only your own signal states are shown. A missing target indicator can mean the target did not share, consent or refresh a signal, the profile path is not public or connected, or a block applies. It never identifies which condition.</p>
   <button type="button" className="min-h-11 text-left text-sm font-medium text-primary underline underline-offset-4" onClick={()=>{window.dispatchEvent(new Event('nmood:retry-indicator-foreground'));void load();}}>Retry foreground and sharing check</button>
  </details>
  {success&&<p role="status" className="text-sm">{success}</p>}
  {busy&&<p role="status" className="text-sm text-muted-foreground">Saving sharing settings…</p>}
  {error&&<div role="alert" className="text-sm leading-relaxed text-destructive"><p>{error}</p><button type="button" className="min-h-11 text-left text-sm font-medium text-primary underline underline-offset-4" onClick={()=>void load()}>Retry sharing settings</button></div>}
 </Card></section>;
}
