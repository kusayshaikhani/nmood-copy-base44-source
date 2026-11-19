import { isRegionalQuery } from './region-cache';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { RealtimeClient } from '@supabase/realtime-js';
import { callSupabaseRpc, getSupabaseSession } from '@/api/supabaseClient';
import { supabaseConfig } from '@/config/supabase-config';
import { passportRuntime } from './passport-runtime';
import { localMembershipSignals, watchPassportProviderChanges } from './passport-provider-adapter';
import { withTimeout } from './bounded-operation';

// Realtime/provider messages never authorize anything. A fresh authenticated,
// actor-bound server confirmation is required after every withdrawal.
export function watchRegionRevocation({ userId, client, onState, transport, readEpoch,
 runtime = passportRuntime, providerSource = localMembershipSignals,
 clearIndicators = () => window.dispatchEvent(new Event('nmood:region-visibility-withdrawn')) }) {
 if (!runtime.enabled) return () => {};
 let stopped=false, subscribed=false, sequence=0, pendingSave=false, expiryTimer, pendingRead;
 let nativeActive=!Capacitor.isNativePlatform(), nativeHandle, nativeEvent=false;
 const visible=()=>nativeActive && !document.hidden && navigator.onLine !== false;
 const rpc=readEpoch || (()=>withTimeout(()=>callSupabaseRpc('nmood_get_passport_runtime_confirmation',{}, {expectedUserId:userId})));
 const socket=transport || new RealtimeClient(`${supabaseConfig.baseUrl.replace(/^http/, 'ws')}/realtime/v1`, {
  params:{apikey:supabaseConfig.publishableKey}, timeout:8000,
  accessToken:async()=>{const s=getSupabaseSession();return !stopped && s?.user?.id===userId?s.access_token:null;},
 });
 function withdraw() {
  sequence++;clearTimeout(expiryTimer);runtime.withdraw();
  onState({ready:false,revision:sequence});clearIndicators();
  // removeQueries is synchronous: even a stalled cancellation cannot retain cards.
  const cancellation=Promise.resolve().then(()=>client.cancelQueries({predicate:isRegionalQuery})).catch(()=>{});
  client.removeQueries({predicate:isRegionalQuery});
  return cancellation;
 }
 async function reauthorize() {
  if(stopped)return;
  const own=sequence;
  if(!subscribed || !visible() || pendingSave)return;
  // Coalesce identical attempts; a newer invalidation owns a distinct request.
  if(pendingRead?.sequence===own)return pendingRead.promise;
  const promise=(async()=>{
   try {
    const startedAt=performance.now();
    const confirmation=await rpc();
    if(stopped || own!==sequence || !subscribed || !visible() || pendingSave)return;
    const state=runtime.confirm(confirmation,userId,{startedAt});
    window.dispatchEvent(new Event('nmood:region-visibility-confirmed'));
    onState({ready:true,revision:own});
    // Deadline is server-bounded; expiration withdraws before any network retry.
    expiryTimer=setTimeout(changed,Math.max(1,state.expires-Date.now()));
   } catch {
    if(!stopped && own===sequence){runtime.withdraw();onState({ready:false,revision:own,error:true});}
   }
  })();
  pendingRead={sequence:own,promise};
  return promise;
 }
 function changed(){if(stopped)return;void withdraw();void reauthorize();}
 const saving=()=>{pendingSave=true;changed();};
 const saved=()=>{pendingSave=false;changed();};
 const visibility=()=>{changed();};
 const sessionChanged=()=>{subscribed=false;changed();};
 withdraw();
 try { socket.channel(`passport-scope:${userId}`,{config:{private:true}})
  .on('broadcast',{event:'invalidate'},changed)
  .subscribe(status=>{if(stopped)return;subscribed=status==='SUBSCRIBED';changed();});
 } catch { onState({ready:false,revision:sequence,error:true}); }
 const stopProvider=watchPassportProviderChanges({source:providerSource,invalidate:()=>{void withdraw();},recheck:reauthorize});
 if(Capacitor.isNativePlatform()) {
  void App.addListener('appStateChange',({isActive})=>{if(stopped)return;nativeEvent=true;nativeActive=isActive;visibility();}).then(handle=>{if(stopped)void handle.remove();else nativeHandle=handle;}).catch(()=>{if(!stopped){nativeActive=false;changed();}});
  void App.getState().then(({isActive})=>{if(!stopped && !nativeEvent){nativeActive=isActive;visibility();}}).catch(()=>{if(!stopped){nativeActive=false;changed();}});
 }
 const events=['online','offline','focus','nmood:access-changed','nmood:request-policy-changed'];
 events.forEach(name=>window.addEventListener(name,changed));
 document.addEventListener('visibilitychange',visibility);
 window.addEventListener('nmood:region-local-change',saved);
 window.addEventListener('nmood:region-save-pending',saving);
 window.addEventListener('nmood:passport-session-changed',sessionChanged);
 return ()=>{
  if(stopped)return;
  stopped=true;sequence++;subscribed=false;clearTimeout(expiryTimer);runtime.withdraw();clearIndicators();stopProvider();
  void nativeHandle?.remove().catch(()=>{});
  document.removeEventListener('visibilitychange',visibility);
  events.forEach(name=>window.removeEventListener(name,changed));
  window.removeEventListener('nmood:region-local-change',saved);window.removeEventListener('nmood:region-save-pending',saving);
  window.removeEventListener('nmood:passport-session-changed',sessionChanged);
  void Promise.resolve(client.cancelQueries({predicate:isRegionalQuery})).catch(()=>{});
  client.removeQueries({predicate:isRegionalQuery});
  void Promise.resolve(socket.removeAllChannels()).catch(()=>{});
  void Promise.resolve(socket.disconnect()).catch(()=>{});
 };
}
