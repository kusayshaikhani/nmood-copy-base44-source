import React, { useId, useState } from 'react';
import { ChevronDown, X } from 'lucide-react';


export default function FilterSelectField({ label, options, selected = [], onChange, searchable = false, emptyLabel = 'Any', clearLabel, help }) {
 const [open, setOpen] = useState(false);
 const [query, setQuery] = useState('');
 const id = useId();
 const names = selected.map(value => options.find(o => o.value === value)?.label || value);
 const summary = names.length ? `${names.slice(0,2).join(', ')}${names.length > 2 ? ` +${names.length-2}` : ''}` : emptyLabel;
 const matches = options.filter(o => o.label.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
 const toggle = value => onChange(selected.includes(value) ? selected.filter(v => v !== value) : [...selected,value]);
 return <div className="min-w-0 space-y-1.5">
  <label id={`${id}-label`} className="text-sm font-semibold text-slate-800">{label}</label>
  <div onKeyDown={event=>{if(event.key==='Escape'){event.stopPropagation();setOpen(false);setQuery('');document.getElementById(`${id}-trigger`)?.focus();}}}>
   <div data-testid={`filter-field-${label}`} className="relative flex min-h-14 items-center rounded-2xl border border-violet-200 bg-white px-2 py-1.5 pr-11 shadow-sm">
    <button id={`${id}-trigger`} type="button" aria-expanded={open} aria-controls={`${id}-options`} onClick={()=>{setOpen(value=>!value);setQuery('');}} aria-labelledby={`${id}-label`} aria-describedby={`${id}-summary`} className="absolute inset-0 min-h-11 rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-600">
     <ChevronDown aria-hidden="true" className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-700" />
    </button>
    <span id={`${id}-summary`} className="sr-only">{summary}</span>
    <div className="pointer-events-none relative flex min-w-0 flex-wrap items-center gap-1">
     {!names.length && <span className="px-2 text-sm text-slate-500">{emptyLabel}</span>}
     {selected.slice(0,2).map((value,i) => <span key={value} className="flex min-w-0 max-w-full items-center rounded-full bg-violet-50 pl-3 text-sm text-violet-900">
      <span className="truncate">{names[i]}</span><button type="button" aria-label={`Remove ${names[i]} from ${label}`} onClick={() => toggle(value)} className="pointer-events-auto inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-600"><X size={14} aria-hidden="true" /></button>
     </span>)}
     {names.length>2 && <span className="px-2 text-sm font-medium text-violet-800">+{names.length-2}</span>}
    </div>
   </div>
   {open&&<div id={`${id}-options`} className="mt-2 w-full rounded-2xl border border-violet-200 bg-white p-2 text-slate-800 shadow-sm">
    {searchable && <input autoFocus aria-label={`Search ${label}`} placeholder={`Search ${label.toLowerCase()}`} value={query} onChange={e => setQuery(e.target.value)} className="mb-2 min-h-11 w-full rounded-xl border border-violet-200 bg-white px-3 text-sm focus:outline-violet-600" />}
    <div onKeyDown={event=>{if(!['ArrowDown','ArrowUp','Home','End'].includes(event.key))return;const controls=[...event.currentTarget.querySelectorAll('input[type="checkbox"]')];if(!controls.length)return;event.preventDefault();const index=controls.indexOf(document.activeElement);const next=event.key==='Home'?0:event.key==='End'?controls.length-1:event.key==='ArrowDown'?(index+1)%controls.length:(index-1+controls.length)%controls.length;controls[next].focus();}} role="group" aria-label={`${label} options`} className="max-h-56 overflow-y-auto overscroll-contain">
     {clearLabel && <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3 text-sm hover:bg-violet-50"><input type="checkbox" checked={!selected.length} onChange={() => onChange([])} className="h-4 w-4 accent-violet-700" />{clearLabel}</label>}
     {matches.map(option => <label key={option.value} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3 text-sm hover:bg-violet-50">
      <input type="checkbox" checked={selected.includes(option.value)} onChange={() => toggle(option.value)} className="h-4 w-4 shrink-0 accent-violet-700" />{option.label}
     </label>)}
     {!matches.length && <p role="status" className="p-3 text-sm text-slate-600">No matching options.</p>}
    </div>
    <button type="button" onClick={() => setOpen(false)} className="mt-1 min-h-11 w-full rounded-xl text-sm font-semibold text-violet-800 hover:bg-violet-50">Done</button>
   </div>}
  </div>
  {help && <p className="text-xs leading-5 text-slate-600">{help}</p>}
 </div>;
}
