import { MAIN_PASSPORT } from '@/lib/passport/enabled';
import { PROFILE_FIELD_CLASS } from './profile-field-style';
import React, { useEffect, useId, useRef, useState } from 'react';
import { WORK_CATALOG, OTHER_WORK_TITLE } from '@/lib/work-catalog';
import { emptyWorkDraft, parseWorkText, parseMainWorkText, workDraftError, WORK_TEXT_LIMIT } from '@/lib/work-profile';

function WorkChoice({ label, value, options, disabled, onChoose }) {
 const id=useId(),root=useRef(null),list=useRef(null),input=useRef(null);
 const [open,setOpen]=useState(false),[query,setQuery]=useState(''),[maxHeight,setMaxHeight]=useState(240);
 const matches=options.filter(option=>option.trim().toLowerCase()!=='done'&&option.toLocaleLowerCase().includes(query.toLocaleLowerCase().trim()));
 useEffect(()=>{
  if(!open)return;
  const close=event=>{if(!root.current?.contains(event.target))setOpen(false);};
  const reveal=()=>{
   const element=list.current;if(!element)return;
   const viewport=window.visualViewport;
   const height=viewport?.height||window.innerHeight;
   setMaxHeight(Math.min(240,Math.max(88,Math.floor(height*0.35))));
   element.scrollIntoView?.({block:'nearest'});
   const overflow=element.getBoundingClientRect().bottom-((viewport?.offsetTop||0)+height-96);
   if(overflow>0){
    let parent=root.current?.parentElement;
    while(parent){
     if(/auto|scroll/.test(window.getComputedStyle(parent).overflowY)&&parent.scrollHeight>parent.clientHeight){parent.scrollTop+=overflow;break;}
     parent=parent.parentElement;
    }
   }
  };
  reveal();document.addEventListener('pointerdown',close);window.visualViewport?.addEventListener('resize',reveal);
  return()=>{document.removeEventListener('pointerdown',close);window.visualViewport?.removeEventListener('resize',reveal);};
 },[open,query]);
 return <div ref={root} onKeyDown={event=>{if(event.key==='Escape'){input.current?.focus();setOpen(false);} if(event.key==='ArrowDown'&&event.target===input.current){event.preventDefault();list.current?.querySelector('button')?.focus();}}}>
  <label htmlFor={id} className="block text-sm font-medium">{label}</label>
  <input id={id} ref={input} role="combobox" aria-expanded={open&&!disabled} aria-controls={`${id}-options`} aria-haspopup="dialog" aria-autocomplete="list" autoComplete="off" disabled={disabled}
   value={open?query:value||''} placeholder={disabled?'Choose Industry first':`Search ${label.toLowerCase()}`}
   onFocus={()=>{setQuery('');setOpen(true);}} onChange={event=>{setQuery(event.target.value);setOpen(true);}}
   className={PROFILE_FIELD_CLASS}/>
  {open&&!disabled&&<div id={`${id}-options`} ref={list} style={{maxHeight}} role="dialog" aria-label={`${label} options`} className="relative z-30 mb-24 scroll-mb-24 max-h-[min(15rem,35dvh)] overflow-y-auto overscroll-contain rounded-xl border bg-card p-2">
   {matches.length?matches.map(option=><button key={option} type="button" className="block min-h-11 w-full px-3 text-start" onClick={()=>{onChoose(option);setOpen(false);}}>{option}</button>):<p role="status">No matching {label.toLowerCase()} options.</p>}
   <button type="button" className="min-h-11 px-3" onClick={()=>setOpen(false)}aria-label={`Close ${label} options`}>Close</button>
  </div>}
 </div>;
}
function LegacyWorkDetailsFields({ data, update }) {
 const draft=data._workDraft ?? parseWorkText(data.work_text);
 const [notice,setNotice]=useState('');
 const error=workDraftError(data);
 const entry=WORK_CATALOG.find(item=>item.industry===draft.industry);
 const setDraft=next=>update({_workDraft:next});
 if (Object.hasOwn(draft,'legacy')) return <section aria-label="Work" className="space-y-2">
  <label className="block">Work (job title / industry)<input className={PROFILE_FIELD_CLASS} maxLength={WORK_TEXT_LIMIT} value={draft.legacy} onChange={event=>setDraft({legacy:event.target.value})}/></label>
  <p className="text-xs">Your existing Work text is kept. You can edit it or choose from the catalog.</p>
  <button type="button" className="min-h-11 text-primary" onClick={()=>setDraft(emptyWorkDraft())}>Choose Industry and Title</button>
 </section>;
 return <section aria-label="Work" className="space-y-3">
  <h3 className="font-medium">Work (optional)</h3>
  <WorkChoice label="Industry" value={draft.industry} options={WORK_CATALOG.map(item=>item.industry)} onChoose={industry=>{
   if(industry===draft.industry)return;
   setDraft({industry,title:'',specification:''});setNotice('Industry changed. Choose a Title; the previous Title and Please specify text have been cleared.');
  }}/>
  <WorkChoice key={draft.industry||'empty'} label="Title" value={draft.title} disabled={!entry} options={entry?.titles||[]} onChoose={title=>{setDraft({...draft,title,specification:title===OTHER_WORK_TITLE?draft.specification||'':''});setNotice('');}}/>
  {draft.title===OTHER_WORK_TITLE&&<label className="block">Please specify<input required className={PROFILE_FIELD_CLASS} value={draft.specification||''} maxLength={Math.max(0,WORK_TEXT_LIMIT-[...`${draft.industry} — Other: `].length)} onChange={event=>setDraft({...draft,specification:event.target.value})}/></label>}
  {notice&&<p role="status" className="text-sm">{notice}</p>}
  {error&&<p role="alert" className="text-sm text-destructive">{error}</p>}
  <button type="button" className="min-h-11 text-primary" onClick={()=>{setDraft(emptyWorkDraft());setNotice('Work will be cleared when you save.');}}>Clear Work</button>
  {data.work_text&&data._workDraft!=null&&<button type="button" className="min-h-11 px-3 text-primary" onClick={()=>{update({_workDraft:null});setNotice('');}}>Keep existing Work</button>}
 </section>;
}

function MainWorkDetailsFields({data,update}) {
 const draft=data._workDraft ?? parseMainWorkText(data.work_text);
 const change=(key,value)=>update({_workDraft:{...draft,freeText:true,[key]:value}});
 return <section aria-label="Work" className="space-y-3">
  <h3 className="font-medium">Work (optional)</h3>
  <label className="block text-sm font-medium">Industry (optional)<input className={PROFILE_FIELD_CLASS} maxLength={WORK_TEXT_LIMIT} value={draft.industry||''} onChange={e=>change('industry',e.target.value)}/></label>
  <label className="block text-sm font-medium">Title (optional)<input className={PROFILE_FIELD_CLASS} maxLength={WORK_TEXT_LIMIT} value={draft.title||''} onChange={e=>change('title',e.target.value)}/></label>
  <p className="text-xs text-muted-foreground">Leave either field blank. Work is optional; use up to 100 characters in total.</p>
  {workDraftError(data)&&<p role="alert">{workDraftError(data)}</p>}
 </section>;
}
export default function WorkDetailsFields(props){return MAIN_PASSPORT?<MainWorkDetailsFields {...props}/>:<LegacyWorkDetailsFields {...props}/>;}
