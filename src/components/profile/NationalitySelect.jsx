import { PROFILE_FIELD_CLASS } from './profile-field-style';
import React, { useEffect, useId, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { COUNTRIES, getCountry } from '@/lib/master-data';

export default function NationalitySelect({value, onChange, t}) {
 const [open,setOpen]=useState(false),[query,setQuery]=useState('');
 const ref=useRef(null), input=useRef(null);const id=useId();
 const search=query.trim().toLocaleLowerCase();
 const matches=search.length>=3?COUNTRIES.filter(country=>[country.name,country.native||''].some(name=>name.toLocaleLowerCase().includes(search))):[];
 const label=value==='prefer_not_to_say'?t('profile.edit.nationality_prefer_not_to_say'):getCountry(value)?.name||value;
 useEffect(()=>{
  if(!open)return;
  const outside=event=>{if(!ref.current?.contains(event.target)){setOpen(false);setQuery('');}};
  document.addEventListener('pointerdown',outside);return()=>document.removeEventListener('pointerdown',outside);
 },[open]);
 const choose=next=>{onChange(next);setQuery('');input.current?.focus();setOpen(false);};
 return <div ref={ref} className="relative" onKeyDown={event=>{if(event.key==='Escape'){setQuery('');input.current?.focus();setOpen(false);}}}>
  <div role="group" aria-label={t('profile.edit.nationality')} className={`${PROFILE_FIELD_CLASS} !h-auto flex flex-wrap items-center gap-2 focus-within:ring-2 focus-within:ring-ring`}>
   {value && <button type="button" aria-label="Remove nationality" onClick={()=>onChange('')} className="min-h-11 max-w-full flex items-center gap-2 rounded-full bg-primary/10 px-3 text-primary dark:text-primary-foreground text-sm"><span className="break-words text-left">{label}</span><X className="w-4 h-4 shrink-0"/></button>}
   <input ref={input} role="combobox" aria-label={t('profile.edit.nationality_search')} aria-expanded={open} aria-controls={id} aria-autocomplete="list" aria-haspopup="dialog"
    value={query} onFocus={()=>setOpen(true)} onChange={event=>{setQuery(event.target.value);setOpen(true);}}
    placeholder={t('profile.edit.nationality_search')} className="min-w-0 flex-1 basis-40 min-h-11 bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"/>
  </div>
  {open && <div id={id} role="dialog" aria-label={t('profile.edit.nationality')} className="absolute z-50 top-full mt-1 w-full rounded-xl border border-border bg-popover shadow-elevated p-2 max-h-60 overflow-y-auto">
   {search.length<3?<p className="p-2 text-sm text-muted-foreground">Type at least 3 characters to search countries.</p>:matches.length?matches.map(country=><button key={country.key} type="button" onClick={()=>choose(country.key)} className="block w-full min-h-11 rounded-lg px-3 py-2 text-left hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring">{country.name}</button>):<p className="p-2 text-sm text-muted-foreground">{t('common.no_results')}</p>}
   <button type="button" onClick={()=>choose('prefer_not_to_say')} className="block w-full min-h-11 rounded-lg px-3 py-2 text-left hover:bg-muted">{t('profile.edit.nationality_prefer_not_to_say')}</button>
  </div>}
 </div>;
}
