import React,{useEffect,useRef,useState} from 'react';
import {safeState} from '@/lib/country-verification/contract.mjs';
export default function GlobalPassport({actor,read,save}){
 const [state,S]=useState(null),[error,E]=useState(false),[busy,B]=useState(false),[clock,T]=useState(Date.now());const epoch=useRef(0);
 useEffect(()=>{let alive=true;const ticket=++epoch.current;S(null);E(false);const refresh=()=>{S(null);read().then(x=>{if(alive&&ticket===epoch.current){S(safeState(x,actor));E(false);}}).catch(()=>{if(alive)E(true);});};refresh();window.addEventListener('focus',refresh);return()=>{alive=false;epoch.current++;window.removeEventListener('focus',refresh);};},[actor,read]);
 useEffect(()=>{if(!state?.premiumUntil)return;const timer=setTimeout(()=>T(Date.now()),Math.min(2147483647,Math.max(1,state.premiumUntil-Date.now())));return()=>clearTimeout(timer);},[state,clock]);
 const premium=state?.verified&&state.premiumUntil>clock;
 async function change(key,value){const ticket=epoch.current;B(true);E(false);S(null);try{const next=await save({[key]:value});if(ticket===epoch.current)S(safeState(next,actor));}catch{if(ticket===epoch.current)E(true);}finally{if(ticket===epoch.current)B(false);}}
 return <section aria-label="Verified country and Global Passport" className="space-y-3 p-4 border rounded-xl"><h2>Country Strict and Global Passport</h2>
 <p>{state?`Country Strict: ${premium&&state.browseEverywhere?'off for browsing':'on'}`:'Country access unavailable until verified'}</p>
 {['browseEverywhere','shareEverywhere'].map((key,i)=><label key={key} className="flex min-h-12 items-center gap-3"><input type="checkbox" checked={!!(premium&&state?.[key])} disabled={!premium||busy||error} onChange={e=>change(key,e.target.checked)}/>{i===0?'Browse Everywhere':'Share Everywhere'}</label>)}
 <p>Verified Premium only. Both options start off, work independently, and reset when Premium ends. Privacy, blocking and eligibility always apply.</p>{error&&<p role="alert">Country access could not be verified. Global access is disabled.</p>}</section>;
}
