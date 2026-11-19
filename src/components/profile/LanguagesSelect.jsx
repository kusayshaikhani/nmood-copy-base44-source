import React, { useEffect, useId, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { languages } from '@/lib/onboarding-data';

export default function LanguagesSelect({value = [], onChange}) {
 const [open,setOpen]=useState(false),[query,setQuery]=useState('');
 const ref=useRef(null), input=useRef(null), list=useRef(null);const id=useId();
 const search=query.trim().toLocaleLowerCase();
 const matches=search.length>=2?languages.filter(language=>language.toLocaleLowerCase().includes(search)):[];
 useEffect(()=>{
  if(!open)return;
  const outside=event=>{if(!ref.current?.contains(event.target)){setOpen(false);setQuery('');}};
  document.addEventListener('pointerdown',outside);return()=>document.removeEventListener('pointerdown',outside);
 },[open]);
 useEffect(()=>{
  if(!open)return;
  const reveal=()=>list.current?.scrollIntoView?.({block:'nearest',behavior:'auto'});
  reveal();window.visualViewport?.addEventListener('resize',reveal);
  return()=>window.visualViewport?.removeEventListener('resize',reveal);
 },[open,query]);
 const choose=next=>{onChange(value.includes(next)?value:value.concat(next));setQuery('');input.current?.focus();setOpen(false);};
 return <div ref={ref} className="relative" onKeyDown={event=>{if(event.key==='Escape'){setQuery('');input.current?.focus();setOpen(false);}}}>
  <div role="group" aria-label={'Languages'} className="flex flex-wrap items-center gap-2 min-h-12 rounded-input border border-border bg-card px-3 py-2">
   {value.map(language => <button key={language} type="button" aria-label={`Remove ${language}`} onClick={()=>onChange(value.filter(item=>item!==language))} className="min-h-11 rounded-full bg-primary/10 px-3 text-primary">{language}<X className="inline w-4 h-4"/></button>)}
   <input ref={input} role="combobox" aria-label={'Search languages'} aria-expanded={open} aria-controls={id} aria-autocomplete="list" aria-haspopup="dialog"
    value={query} onFocus={()=>setOpen(true)} onChange={event=>{setQuery(event.target.value);setOpen(true);}}
    placeholder={'Search languages'} className="min-w-0 flex-1 basis-40 min-h-11 bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"/>
  </div>
  {open && <div ref={list} id={id} role="dialog" aria-label={'Languages'} className="relative z-30 mt-1 mb-24 scroll-mb-24 w-full rounded-xl border border-border bg-popover shadow-elevated p-2 max-h-[min(15rem,35dvh)] overflow-y-auto overscroll-contain">
   {search.length<2?<p className="p-2 text-sm">Type at least 2 characters to search languages.</p>:matches.length?matches.map(language=><button key={language} type="button" onClick={()=>choose(language)} className="block w-full min-h-11 px-3 text-left hover:bg-muted">{language}</button>):<p>No matching languages.</p>}
  </div>}
 </div>;
}
