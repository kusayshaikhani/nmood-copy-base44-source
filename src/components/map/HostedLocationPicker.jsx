import React,{useEffect,useRef,useState} from 'react';
import {MAPS_ORIGIN,MAPS_FRAME_URL,newMapChannel,frameMessage,venueSelection} from '@/lib/maps-frame-protocol';
export default function HostedLocationPicker({onChange}) {
 const [opened,setOpened]=useState(false);const [state,setState]=useState('idle');const [channel]=useState(newMapChannel);
 const frame=useRef(null),callback=useRef(onChange);callback.current=onChange;
 useEffect(()=>{if(!opened)return;let active=true,ready=false;const timer=setTimeout(()=>{active=false;setState('unavailable');},15000);
  const receive=e=>{if(!active||!frameMessage(e,frame.current?.contentWindow,channel))return;
   if(e.data.type==='ready'){clearTimeout(timer);ready=true;setState('ready');}
   else if(e.data.type==='unavailable'){clearTimeout(timer);active=false;setState('unavailable');}
   else if(e.data.type==='selected'&&ready){const selection=venueSelection(e.data.location);if(selection)callback.current?.({...selection,autofilled:true});}
  };window.addEventListener('message',receive);return()=>{active=false;clearTimeout(timer);window.removeEventListener('message',receive);};
 },[opened,channel]);
 return <section className="space-y-3" aria-label="Choose a venue">
  {!opened&&<><button type="button" className="min-h-12 w-full rounded-2xl border bg-card px-4 font-medium text-primary" onClick={()=>{setState('loading');setOpened(true);}}>Choose on map</button><p className="text-sm leading-relaxed text-muted-foreground">Search a venue with Google Maps, or enter its address below. Your device location is not shared.</p></>}
  {opened&&state!=='unavailable'&&<iframe ref={frame} title="Choose an Experience venue" src={`${MAPS_FRAME_URL}#${channel}`} sandbox="allow-scripts allow-same-origin" allow="geolocation 'none'; camera 'none'; microphone 'none'" referrerPolicy="strict-origin-when-cross-origin" className="h-[440px] w-full rounded-2xl border bg-card" onLoad={()=>frame.current?.contentWindow?.postMessage({protocol:'nmood-map-1',type:'init',channel},MAPS_ORIGIN)}/>}
  {state==='loading'&&<p role="status" className="text-sm text-muted-foreground">Opening map…</p>}
  {state==='unavailable'&&<p role="status" className="rounded-2xl border bg-card p-4 text-sm leading-relaxed">The map is unavailable right now. Enter the venue and address below.</p>}
 </section>;
}
