import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import GoogleMapsView from '@/components/map/GoogleMapsView';
import provider from '@/lib/geo/providers/google-places-provider';
import {isGoogleMapsBrowserAvailable} from '@/lib/google-maps-loader';
import {MAPS_ORIGIN,parentMessage,validChannel,pickVenue} from '@/lib/maps-frame-protocol';
import '../index.css';
export function MapsFrame(){
 const channel=window.location.hash.slice(1);const [parentOrigin,setParentOrigin]=useState(null);const [failed,setFailed]=useState(false);
 const [query,setQuery]=useState(''),[rows,setRows]=useState([]),[selection,setSelection]=useState(null),[busy,setBusy]=useState(false),[message,setMessage]=useState('');const lock=useRef(false),alive=useRef(true);
 const send=(type,extra={})=>{if(parentOrigin)window.parent.postMessage({protocol:'nmood-map-1',type,channel,...extra},parentOrigin);};
 useEffect(()=>{alive.current=true;const receive=e=>{if(window.location.origin!==MAPS_ORIGIN||!parentMessage(e,window.parent,channel))return;setParentOrigin(e.origin);};window.addEventListener('message',receive);return()=>{alive.current=false;window.removeEventListener('message',receive);};},[channel]);
 const configured=window.location.origin===MAPS_ORIGIN&&isGoogleMapsBrowserAvailable();
 useEffect(()=>{if(parentOrigin)window.parent.postMessage({protocol:'nmood-map-1',type:configured?'ready':'unavailable',channel},parentOrigin);},[parentOrigin,configured,channel]);
 async function request(action){if(lock.current)return;lock.current=true;setBusy(true);setMessage('');try{await action();}catch{if(alive.current)setMessage('Location search is unavailable. Enter the address in Nmood instead.');}finally{lock.current=false;if(alive.current)setBusy(false);}}
 if(!validChannel(channel)||!parentOrigin||!configured||failed)return <p role="status" className="p-4 text-sm">{failed||parentOrigin?'Enter the venue and address in Nmood.':'Waiting for Nmood…'}</p>;
 return <main className="space-y-3 p-3 text-sm"><form className="flex gap-2" onSubmit={e=>{e.preventDefault();if(query.trim().length<2)return;void request(async()=>{const result=await provider.search(query.trim());if(!alive.current)return;setRows(result.results||[]);if(result.status==='error'||result.status==='not_configured')throw Error('unavailable');setMessage(result.results?.length?'':'No matching locations. Try another venue or enter its address in Nmood.');});}}><input aria-label="Search venue or address" maxLength={200} value={query} onChange={e=>setQuery(e.target.value)} className="min-h-12 min-w-0 flex-1 rounded-xl border bg-card px-3 text-base"/><button disabled={busy} className="min-h-12 rounded-xl bg-primary px-4 text-white">Search</button></form>
 {busy&&<p role="status">Finding location…</p>}{message&&<p role="status">{message}</p>}
 {rows.length>0&&<ul aria-label="Google location suggestions" className="max-h-36 overflow-auto">{rows.map(row=><li key={row.id}><button type="button" disabled={busy} className="min-h-11 w-full border-b py-2 text-left" onClick={()=>void request(async()=>{const value=pickVenue(await provider.resolve(row));if(!value)throw Error('unavailable');if(alive.current){setSelection(value);setRows([]);}})}>{row.place_name||row.text}</button></li>)}</ul>}
 <div className="h-56 overflow-hidden rounded-xl"><GoogleMapsView center={selection?.coordinates||[25.2048,55.2708]} markerPosition={selection?.coordinates} height="100%" interactive showControls={false} showMyLocation={false} onMapClick={([lat,lng])=>void request(async()=>{const value=pickVenue(await provider.reverse(lat,lng));if(!value)throw Error('unavailable');if(alive.current)setSelection(value);})} onError={()=>{setFailed(true);send('unavailable');}}/></div>
 {selection&&<><p>{selection.address||selection.venueName}</p><button className="min-h-12 w-full rounded-xl bg-primary px-4 text-white" onClick={()=>send('selected',{location:selection})}>Use this venue</button></>}
 <p className="text-xs text-muted-foreground">Location suggestions from Google Maps. No device location is accessed.</p></main>;
}
const root=document.getElementById('root');
if(root)createRoot(root).render(<MapsFrame/>);
