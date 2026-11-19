import React,{createContext,useContext,useEffect,useState} from 'react';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '@/lib/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { callSupabaseRpc, getSupabaseSession } from '@/api/supabaseClient';
import { detectLocation } from '@/lib/location-detection';
import { connectRehearsalPassport } from '@/lib/passport-rehearsal-runtime';
import { REGION_ENABLED } from '@/lib/region-config';
import { registerDestinationController } from '@/lib/destination-session';
import { isRegionalQuery } from '@/lib/region-cache';
import { RealtimeClient } from '@supabase/realtime-js';
import { supabaseConfig } from '@/config/supabase-config';
import {DestinationPassportControls} from './DestinationPassportControls';
export {DestinationPassportControls} from './DestinationPassportControls';

const DestinationContext=createContext(null);
export function DestinationSettings(){const controller=useContext(DestinationContext);return controller?<DestinationPassportControls controller={controller}/>:<p role="status">Passport is unavailable.</p>;}

export function ConnectedDestination({children,showControls=true}){
 const {user}=useAuth(),client=useQueryClient();
 const [connection,setConnection]=useState({actor:null,status:'checking',controller:null});
 const controller=connection.actor===user?.id?connection.controller:null;
 useEffect(()=>{
  if(!user?.id||!REGION_ENABLED)return;
  let disposed=false,handle,unregister=()=>{},nativeStateSeen=false,stopScope=()=>{};
  const clear=()=>{void Promise.resolve().then(()=>client.cancelQueries({predicate:isRegionalQuery})).catch(()=>{});client.removeQueries({predicate:isRegionalQuery});window.dispatchEvent(new Event('nmood:region-visibility-withdrawn'));};
  const rpc=(name,args={})=>callSupabaseRpc(name,args,{expectedUserId:user.id});
  const transport=()=>new RealtimeClient(`${supabaseConfig.baseUrl.replace(/^http/,'ws')}/realtime/v1`,{
   params:{apikey:supabaseConfig.publishableKey},timeout:8000,
   accessToken:async()=>{const session=getSupabaseSession();return !disposed&&session?.user?.id===user.id?session.access_token:null;},
  });
  const connection=connectRehearsalPassport({enabled:REGION_ENABLED,actor:user.id,
   api:{ready:()=>rpc('nmood_passport_candidate_ready'),read:()=>rpc('nmood_passport_candidate_scope'),
    area:(area,source)=>rpc('nmood_passport_candidate_area',{p_area:area,p_source:source}),
    passport:country=>rpc('nmood_passport_candidate_destination',{p_country:country}),
    challenge:()=>rpc('nmood_passport_candidate_challenge'),receipt:(nonce,revision)=>rpc('nmood_passport_candidate_receipt',{p_nonce:nonce,p_revision:revision})},
   createTransport:transport,getToken:async()=>{const session=getSupabaseSession();return session?.user?.id===user.id?session.access_token:null;},
   detect:()=>detectLocation({fresh:true}),clear,
   onReady:value=>{if(disposed)return;unregister();stopScope();unregister=registerDestinationController(user.id,value);let previous=null;stopScope=value.subscribe(()=>{const state=value.getSnapshot();const revision=state.status==='ready'?state.scope.revision:null;if(revision!==null&&revision!==previous)window.dispatchEvent(new Event('nmood:region-visibility-confirmed'));previous=revision;});setConnection({actor:user.id,status:'connected',controller:value});},
   onUnsupported:()=>{if(disposed)return;clear();unregister();unregister=registerDestinationController(user.id,null);setConnection({actor:user.id,status:'unsupported',controller:null});},
   onBlocked:()=>{if(!disposed)setConnection(prior=>({...prior,actor:user.id,status:'blocked'}));}
  });
  if(Capacitor.isNativePlatform()){
   connection.foreground(false);
   void App.addListener('appStateChange',({isActive})=>{nativeStateSeen=true;connection.foreground(isActive);}).then(value=>{if(disposed)void value.remove();else handle=value;}).catch(()=>connection.foreground(false));
   void App.getState().then(({isActive})=>{if(!disposed&&!nativeStateSeen)connection.foreground(isActive);}).catch(()=>connection.foreground(false));
  }
  return()=>{disposed=true;stopScope();void handle?.remove();void connection.stop();unregister();};
 },[user?.id,client]);
 if(!REGION_ENABLED||!user?.id||connection.actor===user.id&&connection.status==='unsupported')return children;
 // Keep this provider in place while the passport controller moves through its
 // readiness states.  In particular, Settings is outside the regional UI, so
 // adding the provider after readiness must not remount and restart Settings.
 return <DestinationContext.Provider value={controller}>{showControls?(controller?<DestinationPassportControls controller={controller}>{children}</DestinationPassportControls>:<p role="status">Passport is unavailable while server support is checked. Existing private conversations remain available.</p>):children}</DestinationContext.Provider>;
}
export default function DestinationDiscoveryGate({children}){
 const {pathname}=useLocation();
 const relevant=/^\/$|^\/(explore|discover-people|people|pals|nmoods?|circles|experiences|pal|circle|experience|inmood|inmood-v2|in-orbit|communities|new-to-nmood|saved)(\/|$)/.test(pathname)&&!/(\/chat|\/messages|\/timeline)(\/|$)/.test(pathname);
 return <ConnectedDestination showControls={relevant}>{children}</ConnectedDestination>;
}
