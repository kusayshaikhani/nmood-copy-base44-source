import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { COUNTRIES } from '@/lib/master-data';
import { citiesForCountry } from '@/lib/passport/scope';
import { MAIN_PASSPORT } from '@/lib/passport/enabled';
import { EMPTY_AUDIENCE, broadcastFingerprint, isOperationsAdmin } from '@/lib/mission-control/operations';
import { previewBroadcast, sendBroadcast, exportDirectory, saveDirectoryExport } from '@/api/mainOperations';
const field = 'min-h-11 w-full min-w-0 rounded-xl border border-border bg-background px-3 py-2 text-sm';
export default function BroadcastComposer({ directoryOnly = false }) {
 const { user } = useAuth();
 const [filters, setFilters] = useState({ ...EMPTY_AUDIENCE });
 const [title, setTitle] = useState(directoryOnly?'Member directory':''); const [body, setBody] = useState(directoryOnly?'Filtered directory export':''); const [exclusions, setExclusions] = useState('');
 const [preview, setPreview] = useState(null); const [confirm, setConfirm] = useState(false); const [busy, setBusy] = useState(false); const [notice, setNotice] = useState('');
 const generation = useRef(0);
 const sendKey = useRef(null);
 useEffect(()=>{sendKey.current=null;generation.current++;setPreview(null);setConfirm(false);setNotice('');},[user?.id]);
 const edit = fn => { sendKey.current=null; generation.current++; setPreview(null); setConfirm(false); setNotice(''); fn(); };
 const change = (key, value) => edit(() => setFilters(f => ({ ...f, [key]: value, ...(key === 'country' ? { city: '' } : {}) })));
 const input = () => ({ title, body, channel: 'in_app', filters: { ...filters, excluded_ids: exclusions.split(/[\s,]+/).filter(Boolean) } });
 const review = async () => { const attempt = ++generation.current; setBusy(true);setNotice('');setPreview(null);setConfirm(false);try {
  const value=input();const fingerprint=broadcastFingerprint(value);const result=await previewBroadcast(value);
  if(attempt===generation.current){sendKey.current ||= crypto.randomUUID();setPreview({...result,localFingerprint:fingerprint});}
 } catch(e){if(attempt===generation.current)setNotice(e.message?.startsWith('Enter ')||e.message?.startsWith('Exclusions ') ? e.message : 'Preview unavailable. No messages were sent.');} finally {setBusy(false);} };
 const hold = async () => {if(!preview||!confirm||busy)return;setBusy(true);setNotice('');try {
  const value=input();if(broadcastFingerprint(value)!==preview.localFingerprint)throw Error('Preview changed');
  const receipt=await sendBroadcast(value,preview.fingerprint,'SEND IN-APP ANNOUNCEMENT',sendKey.current);if(receipt?.sent!==true)throw Error('Delivery not acknowledged');setPreview(null);setConfirm(false);setNotice('In-app announcement delivered. No push or email sent.');
 }catch{setPreview(null);setConfirm(false);setNotice('Outcome unconfirmed or audience changed. Preview again with the same draft to safely check this request.');}finally{setBusy(false);} };
 const download=async format=>{if(!preview||busy)return;const attempt=generation.current;setBusy(true);setNotice('');try{const v=input();if(broadcastFingerprint(v)!==preview.localFingerprint)throw Error('Preview changed');const result=await exportDirectory(v,format);if(attempt!==generation.current)return;await saveDirectoryExport(result);setNotice(`Export generated for ${result.row_count} members and audited.`);}catch{setNotice('Export unavailable or cancelled. No messages were sent.');}finally{setBusy(false);}};
 if(!MAIN_PASSPORT||!isOperationsAdmin(user))return <p role="alert">Administrator access required.</p>;
 return <section aria-label="Broadcast composer" className="mx-auto max-w-3xl min-w-0 space-y-5">
  <header><h1 className="text-2xl font-semibold">{directoryOnly?'Export member directory':'Member announcements'}</h1><p className="mt-2 text-sm text-muted-foreground">{directoryOnly?'Choose the export audience, preview eligibility, then download a server-generated CSV or Excel file.':'Compose and review an in-app announcement. Delivery requires an audience preview and your final confirmation.'}</p></header>
  <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
   <label className="block text-sm">Channel<select className={field} value="in_app" onChange={()=>{}}><option value="in_app">In-app announcement</option><option value="push" disabled>Push notification — setup required</option><option value="email" disabled>Email — sender verification required</option></select></label><p className="text-xs text-muted-foreground">In-app announcements do not require push or email opt-in. Account restrictions, blocks and explicit in-app opt-outs still apply. Push and email delivery are disabled.</p>
   <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={filters.include_platform_admins} onChange={e=>change('include_platform_admins',e.target.checked)}/>Include platform admins (including yourself)</label>
   {!directoryOnly&&<><label className="block text-sm">Title<input className={field} value={title} maxLength={120} onChange={e=>edit(()=>setTitle(e.target.value))}/></label>
   <label className="block text-sm">Message<textarea className={`${field} min-h-28`} value={body} maxLength={2000} onChange={e=>edit(()=>setBody(e.target.value))}/></label></>}
   <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
    <label className="text-sm">Country<select className={field} value={filters.country} onChange={e=>change('country',e.target.value)}><option value="">All countries (admin audience)</option>{COUNTRIES.map(c=><option key={c.iso2} value={c.iso2}>{c.name}</option>)}</select></label>
    <label className="text-sm">City<select className={field} disabled={!filters.country} value={filters.city} onChange={e=>change('city',e.target.value)}><option value="">All cities</option>{citiesForCountry(filters.country).map(c=><option key={c.key} value={c.key}>{c.name}</option>)}</select></label>
    {[['account_status','Account status',['active','paused','hidden','deleted','suspended','banned']],['premium','Premium status',['any','premium','free']],['onboarding','Onboarding status',['any','complete','incomplete']],['activity','Activity status',['any','active_30d','inactive_30d']]].map(([key,label,options])=><label key={key} className="text-sm">{label}<select className={field} value={filters[key]} onChange={e=>change(key,e.target.value)}>{options.map(o=><option key={o}>{o}</option>)}</select></label>)}
    <label className="text-sm">Gender/profile label<input className={field} value={filters.gender} maxLength={80} onChange={e=>change('gender',e.target.value)} placeholder="Any; exact stored gender label"/></label>
    {[['age_min','Minimum age',18,120],['age_max','Maximum age',18,120],['birthday_month','Birthday month',1,12]].map(([key,label,min,max])=><label key={key} className="text-sm">{label}<input className={field} type="number" min={min} max={max} value={filters[key]} onChange={e=>change(key,e.target.value)}/></label>)}
   </div>
   <p className="text-xs text-muted-foreground">Age and birthday matching happens privately on the server. No birth dates are returned. Hidden activity is not available for targeting.</p>
   <label className="block text-sm">Exclude member IDs<textarea className={field} value={exclusions} onChange={e=>edit(()=>setExclusions(e.target.value))} placeholder="Comma-separated member UUIDs"/></label>
   <button className="min-h-11 rounded-xl bg-primary px-4 text-primary-foreground disabled:opacity-50" disabled={busy} onClick={review}>Preview audience</button>
  </div>
  {preview&&<section aria-label="Announcement review" className="rounded-2xl border border-primary/30 bg-card p-4 space-y-3">
   <p className="font-semibold">{preview.recipient_count} recipients · {preview.excluded_count} excluded</p>
   {preview.recipient_count===0&&<p role="status" className="text-sm">No eligible recipients match this audience. See the exact exclusion reasons below. Missing push/email preferences do not exclude in-app recipients. No announcement will be sent.</p>}
   <p className="break-words text-sm">Country: {filters.country||'all'} · City: {filters.city||'all'} · Account: {filters.account_status} · Premium: {filters.premium} · Onboarding: {filters.onboarding} · Gender: {filters.gender||'any'} · Age: {filters.age_min||'any'}–{filters.age_max||'any'} · Birthday month: {filters.birthday_month||'any'} · Activity: {filters.activity} · Explicit exclusions: {input().filters.excluded_ids.length}</p>
   <p className="text-sm">Platform admins: {filters.include_platform_admins?'included':'excluded'}</p>
   {preview.exclusion_reasons&&<ul aria-label="Exclusion reasons" className="text-xs space-y-1">{Object.entries(preview.exclusion_reasons).map(([reason,count])=><li key={reason}>{reason}: {count}</li>)}</ul>}
   {preview.members&&<details><summary className="text-sm">Recipients and exclusions</summary><ul className="text-xs space-y-2 break-words">{preview.members.map(m=><li key={m.member_id}>{m.name||m.member_id}: {m.eligible?'Eligible':m.reasons.join(', ')}</li>)}</ul>{preview.members_truncated&&<p>Showing the first 500 members; totals include the full audience. Narrow filters to review everyone.</p>}</details>}
   {!directoryOnly&&<><article className="rounded-xl bg-muted/40 p-3 break-words"><h2 className="font-semibold">{title}</h2><p className="whitespace-pre-wrap text-sm">{body}</p></article>
   <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={confirm} onChange={e=>setConfirm(e.target.checked)}/>I reviewed the audience, exclusions, and message. Send this in-app announcement once. This cannot be recalled.</label>
   <button className="min-h-11 rounded-xl border px-4 disabled:opacity-50" disabled={!confirm||busy||!preview.recipient_count} onClick={hold}>Send in-app announcement</button></>}
   <div className="flex flex-wrap gap-2" aria-label="Directory export"><button className="min-h-11 rounded-xl border px-4" disabled={busy||!preview.recipient_count} onClick={()=>download('csv')}>Export CSV</button><button className="min-h-11 rounded-xl border px-4" disabled={busy||!preview.recipient_count} onClick={()=>download('xlsx')}>Export Excel</button></div>
   <p className="text-xs">Exports contain only permitted directory fields and are audited. No birth dates, precise locations, messages or credentials.</p>
  </section>}
  {notice&&<p role="status" className="text-sm">{notice}</p>}
 </section>;
}
