import React,{useState,useRef,useEffect} from 'react';
import {Link} from 'react-router-dom';
import {askNmoodAssistant} from '@/lib/nmood-assistant';

// Explicit button only: typing, Enter, and normal search never invoke a provider.
export default function AskNmood({question,identity}) {
 const [state,setState]=useState({});
 const [inFlight,setInFlight]=useState(false);
 const busy=useRef(false),generation=useRef(0);
 useEffect(()=>{generation.current+=1;setState({});},[question,identity]);
 useEffect(()=>()=>{generation.current+=1;},[]);
 const ask=async()=>{
  if(busy.current||!question.trim())return;
  busy.current=true;setInFlight(true);const version=generation.current;setState({pending:true});
  try {const reply=await askNmoodAssistant(question);if(version===generation.current)setState({reply});}
  catch(error){if(version===generation.current)setState({error:error.message,upgradeAvailable:error.upgradeAvailable===true});}
  finally{busy.current=false;setInFlight(false);if(version!==generation.current)setState({});}
 };
 return <div className="mt-3 space-y-2">
  <div className="flex flex-wrap items-center gap-x-3 gap-y-1"><button type="button" disabled={!question.trim()||inFlight} onClick={ask} className="min-h-11 rounded-full border border-white/40 bg-white/15 px-4 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-50">{inFlight?'Asking Nmood…':'Ask Nmood'}</button><p className="max-w-sm text-xs leading-relaxed text-white/90">Optional AI guide. Only your question is sent to OpenAI when you ask. Keep personal or private details out.</p></div>
  {(state.pending||state.reply||state.error)&&<div role="status" aria-live="polite" className="rounded-2xl bg-white p-4 text-sm leading-relaxed text-slate-800 shadow-sm">
   {state.pending?<p>Finding a little inspiration. Smart Search is still available below.</p>:state.reply?<><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-700">Nmood guide</p><p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{state.reply}</p><p className="mt-3 text-xs text-slate-600">AI suggestions may be mistaken. Explore actual Nmood matches below.</p></>:<><p>{state.error}</p>{state.upgradeAvailable&&<Link to="/upgrade" className="mt-2 inline-flex min-h-11 items-center rounded-xl bg-blue-700 px-4 font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">Explore Premium</Link>}</>}
  </div>}
 </div>;
}
