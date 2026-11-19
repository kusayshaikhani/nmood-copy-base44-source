import React,{useState,useSyncExternalStore} from 'react';
import {COUNTRIES} from '@/lib/master-data';

export function DestinationPassportControls({controller,children}){
 const state=useSyncExternalStore(controller.subscribe,controller.getSnapshot),[country,setCountry]=useState(''),[city,setCity]=useState(''),[error,setError]=useState('');
 const scope=state.scope;
 const change=async operation=>{setError('');try{await operation();}catch{setError('Review your country choice. Premium is required for Passport.');}};
 return <><section aria-label="Discovery location" className="mx-auto max-w-2xl space-y-3 p-4">
 <h2 className="font-semibold">{scope?.mode==='passport'?'Premium Passport':'Your local area'}</h2>
 {scope&&<p>{scope.mode==='passport'?`Browsing ${COUNTRIES.find(c=>c.iso2===scope.country)?.name||scope.country}`:`${scope.city}, ${COUNTRIES.find(c=>c.iso2===scope.country)?.name||scope.country}`}</p>}
 {state.status==='manual'&&<><p role="status">Location is unavailable. Choose your country and city manually.</p><label>Country<select aria-label="Country" value={country} onChange={e=>setCountry(e.target.value)} className="min-h-12 w-full rounded-xl border bg-card">{options()}</select></label><label>City<input aria-label="City" value={city} onChange={e=>setCity(e.target.value)} className="min-h-12 w-full rounded-xl border bg-card"/></label><button onClick={()=>void change(()=>controller.manual({country,city}))}>Use country and city</button></>}
 {state.status==='checking'&&<p role="status">Refreshing authorized discovery…</p>}{state.error&&state.status!=='manual'&&<p role="alert">{state.error}</p>}
 <button onClick={()=>void controller.locate()}>Detect current area</button>
 <label className="flex items-center gap-3"><input type="checkbox" aria-label="Passport" checked={scope?.mode==='passport'} disabled={state.status!=='ready'||!scope.premium} onChange={e=>{if(!e.target.checked)void change(controller.off);else void change(()=>controller.passport(country));}}/>Passport — Premium</label>
 <label>Destination country<select aria-label="Destination country" value={scope?.mode==='passport'?scope.country:country} disabled={state.status!=='ready'||!scope?.premium} onChange={e=>{const value=e.target.value;setCountry(value);if(scope?.mode==='passport')void change(()=>controller.passport(value));}} className="min-h-12 w-full rounded-xl border bg-card">{options()}</select></label>
 <p className="text-sm text-muted-foreground">Choose one destination, then turn Passport on. Turning it off restores your latest local area. Your Home Country stays unchanged.</p>
 {error&&<p role="alert">{error}</p>}
 </section>{state.status==='ready'?<React.Fragment key={scope.revision}>{children}</React.Fragment>:null}</>;
}
function options(){return <><option value="">Choose country</option>{COUNTRIES.map(c=><option key={c.iso2} value={c.iso2}>{c.name}</option>)}</>;}
