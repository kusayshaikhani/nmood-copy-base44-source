import { PROFILE_FIELD_CLASS } from './profile-field-style';
import React, { useState, useRef } from 'react';
export default function LocalProfileChoice({ value, options, onChange, label, placeholder }) {
 const [open,setOpen]=useState(false),[error,setError]=useState(false),[busy,setBusy]=useState(false);const lock=useRef(false);
 const choose=async next=>{
  if(lock.current)return;
  if(next!==''&&!options.some(option=>option.value===next)){setError(true);return;}
  lock.current=true;setBusy(true);setError(false);
  try{await onChange(next);setOpen(false);}catch{setError(true);}finally{lock.current=false;setBusy(false);}
 };
 const selected=options.find(option=>option.value===value);
 return <div onKeyDown={event=>{if(event.key==='Escape'&&!busy)setOpen(false);}}>
  <button type="button" aria-label={label} aria-expanded={open} disabled={busy} className={PROFILE_FIELD_CLASS} onClick={()=>setOpen(!open)}>{selected?.label||placeholder}</button>
  {open&&<div role="group" aria-label={`${label} choices`} className="rounded-xl border p-2">
   {options.map(option=><button type="button" key={option.value} aria-pressed={value===option.value} disabled={busy} className="block min-h-11 w-full px-3 text-start" onClick={()=>choose(option.value)}>{option.label}</button>)}
   <button type="button" disabled={busy} className="min-h-11 px-3" onClick={()=>choose('')}>Clear selection</button>
   <button type="button" disabled={busy} className="min-h-11 px-3" onClick={()=>setOpen(false)}>Cancel</button>
  </div>}
  {(error||(value&&!selected))&&<p role="alert">Please choose again. Your other details are kept.</p>}
 </div>;
}
