import {detectionFailureText} from '@/lib/country-verification/detection-diagnostics.mjs';
import React,{useEffect,useRef,useState} from 'react';
import {ERRORS,safeDetection,matchCountry} from '@/lib/country-verification/contract.mjs';
export default function CountryVerification({actor,countries,detect,confirm,recover,onVerified,preview=false,onDetected}) {
 const [result,R]=useState(null),[selected,S]=useState(''),[error,E]=useState(''),[busy,B]=useState(false),[done,D]=useState(false);
 const epoch=useRef(0),controller=useRef(null);
 useEffect(()=>{epoch.current++;controller.current?.abort();R(null);S('');E('');B(false);D(false);return()=>{epoch.current++;controller.current?.abort();};},[actor]);
 async function run(){const ticket=++epoch.current;controller.current?.abort();const c=new AbortController();controller.current=c;R(null);S('');E('');D(false);B(true);
  try{const value=safeDetection(await detect({signal:c.signal}));if(ticket!==epoch.current||c.signal.aborted)return;if(!countries.some(x=>x.code===value.country))throw Error('unavailable');R(value);S(value.country);}
  catch(e){if(ticket===epoch.current)E(detectionFailureText(e));}finally{if(ticket===epoch.current)B(false);}
 }
 async function save(){if(busy||done)return;const ticket=++epoch.current;B(true);E('');try{matchCountry(selected,result);if(preview){onDetected?.(result);D(true);return;}const state=await confirm({country:selected,detection:result});if(ticket!==epoch.current)return;if(state?.verified!==true||state.actor!==actor||state.country!==selected)throw Error('unavailable');onVerified?.(state);D(true);}catch(e){if(ticket===epoch.current)E(ERRORS[e?.message]||ERRORS.unavailable);}finally{if(ticket===epoch.current)B(false);}}
 async function recoverDevice(){
  if(busy||typeof recover!=='function'||!window.confirm('Replace device verification? Your verified country and Passport opt-ins will be cleared. You must verify your country again.'))return;
  const ticket=++epoch.current;controller.current?.abort();B(true);E('');R(null);S('');D(false);
  try{const result=await recover();if(result?.reverificationRequired!==true)throw Error('recovery');}
  catch(e){if(ticket===epoch.current)E(ERRORS[e?.message]||ERRORS.recovery);}finally{if(ticket===epoch.current)B(false);}
 }
 return <section aria-label="Required country verification" className="space-y-4 rounded-xl border p-4">
 <h2 className="font-semibold">Verify your current country</h2><p>Location permission is required. Only your confirmed country and verification time are saved. Your precise location is not sent or stored.</p>
 <button type="button" disabled={busy||done} className="min-h-12 rounded border px-4" onClick={run}>{busy?'Verifying…':'Verify device country'}</button>
 <label className="block">Country<select aria-label="Verified country" value={selected} disabled className="block w-full min-h-12 border rounded p-2"><option value="">Verify your location first</option>{countries.map(c=><option key={c.code} value={c.code}>{c.name}</option>)}</select></label>
 <p className="text-sm">Country must match your device. Country Strict starts on; both Global Passport choices start off.</p>
 {error&&<div><p role="alert" className="text-red-700 border border-red-600 bg-red-50 p-3 rounded">{error}</p><nav aria-label="Verification recovery" className="flex gap-4 py-3"><a href="/login" className="underline">Return to sign in</a><a href="/support" className="underline">Contact support</a></nav></div>}
 {typeof recover==='function'&&<button type="button" disabled={busy} onClick={recoverDevice} className="min-h-12 underline">Recover device verification</button>}
 <button type="button" disabled={!result||busy||done} className="min-h-12 rounded bg-primary text-primary-foreground px-4 disabled:opacity-50" onClick={save}>{preview?'Continue with detected country':'Confirm verified country'}</button>
 {done&&<p role="status">{preview?'Country detected; server verification still required':'Country verified'}</p>}
 </section>;
}
