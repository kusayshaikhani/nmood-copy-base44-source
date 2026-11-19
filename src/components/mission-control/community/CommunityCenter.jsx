import React,{useEffect,useRef,useState} from 'react';
import {communityOperation,missionHistory} from '@/api/missionControl';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
const kinds=[['circles','Circles'],['experiences','Experiences'],['posts','Nmood Shares'],['reports','Reports']];
const field='min-h-11 rounded-xl border bg-background px-3 py-2 text-sm';
const title=r=>r?.data?.title||r?.data?.name||r?.data?.category||'Untitled';
export default function CommunityCenter({defaultTab='experience'}){
 const[kind,setKind]=useState(defaultTab==='circle'?'circles':'experiences'),[search,setSearch]=useState(''),[filter,setFilter]=useState('all'),[offset,setOffset]=useState(0);
 const[rows,setRows]=useState([]),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[revision,setRevision]=useState(0);
 const[dialog,setDialog]=useState(null),[reason,setReason]=useState(''),[typed,setTyped]=useState(''),[members,setMembers]=useState(null),[history,setHistory]=useState(null);
 const sequence=useRef(0),mutation=useRef(false);
 const refresh=()=>setRevision(x=>x+1);
 useEffect(()=>{const token=++sequence.current;setBusy(true);setError('');setRows([]);const timer=setTimeout(()=>{
  communityOperation({action:'list',kind,search,state:filter,offset}).then(data=>{if(sequence.current===token)setRows(data);}).catch(e=>{if(sequence.current===token)setError(e.message);}).finally(()=>{if(sequence.current===token)setBusy(false);});
 },200);return()=>{clearTimeout(timer);sequence.current++;};},[kind,search,filter,offset,revision]);
 const open=(row,action,request)=>{setReason('');setTyped('');setError('');setDialog({row,action,request});};
 const inspect=async(row,mode)=>{setError('');try{if(mode==='members')setMembers({row,items:await communityOperation({action:'members',kind:row.kind,source:row.source,target:row.id})});else setHistory(await missionHistory(row.id));}catch(e){setError(e.message);}};
 const apply=async()=>{
  if(!dialog||mutation.current||!reason.trim())return;mutation.current=true;setBusy(true);setError('');const{row,action,request}=dialog;
  try{await communityOperation({action,kind:row.kind,source:row.source,target:row.id,reason:reason.trim(),confirmation:typed,...(request?{request_id:request.id}:{})});setNotice('Action completed and recorded in the audit history.');setDialog(null);refresh();if(members)await inspect(members.row,'members');}
  catch(e){setError(e.message);}finally{mutation.current=false;setBusy(false);}
 };
 return <section className="space-y-5 min-w-0"><header><h1 className="text-2xl font-bold">Community Management</h1><p>Manage content, participation requests, reports, and moderation history.</p></header>
 <nav aria-label="Community categories" className="flex flex-wrap gap-2">{kinds.map(([id,label])=><Button key={id} aria-pressed={kind===id} variant={kind===id?'default':'outline'} onClick={()=>{setKind(id);setFilter('all');setOffset(0);setMembers(null);setHistory(null);}}>{label}</Button>)}</nav>
 <div className="flex flex-wrap gap-2"><input aria-label="Search community content" className={field+' flex-1 min-w-0'} placeholder="Search title, category, location or report details" value={search} onChange={e=>{setSearch(e.target.value);setOffset(0);}}/><select aria-label="Content status" className={field} value={filter} onChange={e=>{setFilter(e.target.value);setOffset(0);}}>{(kind==='reports'?['all','open','actioned','dismissed']:['all','featured','hidden','archived','removed','draft']).map(s=><option key={s} value={s}>{s==='all'?'All statuses':s}</option>)}</select><Button variant="outline" onClick={refresh}>Refresh</Button></div>
 {error&&<p role="alert" className="text-destructive break-words">{error}</p>}{notice&&<p role="status">{notice}</p>}
 {busy&&!dialog?<p role="status">Loading…</p>:!error&&rows.length===0?<p>No matching content.</p>:null}
 <div className="grid gap-3">{rows.map(row=><article key={row.source+row.id} className="border rounded-xl p-4 min-w-0 space-y-3"><h2 className="font-semibold break-words">{title(row)}</h2><p className="text-sm">{row.data?.status||'Active'}{row.featured?' · Featured':''}{row.hidden?' · Hidden':''}{row.archived?' · Archived':''}{row.removed?' · Removed':''}</p>
 {kind==='reports'&&<p className="text-sm whitespace-pre-wrap break-words">{row.data?.details}</p>}
 <div className="flex flex-wrap gap-2">{(kind==='reports'?[['resolve','Resolve'],['dismiss','Dismiss'],['reopen','Reopen']]:[[row.featured?'unfeature':'feature',row.featured?'Unfeature':'Feature'],[row.hidden?'unhide':'hide',row.hidden?'Unhide':'Hide'],[row.archived||row.removed?'restore':'archive',row.archived||row.removed?'Restore':'Archive'],['remove','Remove']]).map(([action,label])=><Button key={action} variant="outline" disabled={busy} onClick={()=>open(row,action)}>{label}</Button>)}
 {kind!=='reports'&&<Button variant="outline" onClick={()=>inspect(row,'members')}>Members & requests</Button>}<Button variant="outline" onClick={()=>inspect(row,'history')}>Audit history</Button></div></article>)}</div>
 <div className="flex gap-2"><Button variant="outline" disabled={busy||offset===0} onClick={()=>setOffset(x=>Math.max(0,x-50))}>Previous</Button><span>Page {offset/50+1}</span><Button variant="outline" disabled={busy||rows.length<50} onClick={()=>setOffset(x=>x+50)}>Next</Button></div>
 {members&&<section className="border rounded-xl p-4 space-y-3"><h2 className="font-semibold">Members & requests — {title(members.row)}</h2><Button variant="outline" onClick={()=>setMembers(null)}>Close members</Button>{members.items.length===0&&<p>No membership records.</p>}{members.items.map(m=><div key={m.id} className="flex flex-wrap items-center gap-2"><span className="break-words">{m.name||'Member'} · {m.status}</span>{['pending','waiting'].includes(m.status)&&<><Button onClick={()=>open(members.row,'approve_member',m)}>Approve</Button><Button variant="outline" onClick={()=>open(members.row,'decline_member',m)}>Decline</Button></>}{['member','going','accepted','confirmed'].includes(m.status)&&<Button variant="outline" onClick={()=>open(members.row,'remove_member',m)}>Remove member</Button>}</div>)}</section>}
 {history&&<section className="border rounded-xl p-4 space-y-3"><h2 className="font-semibold">Audit history</h2><Button variant="outline" onClick={()=>setHistory(null)}>Close history</Button>{history.length===0?<p>No operations recorded.</p>:history.map(e=><p key={e.id} className="text-sm break-words">{new Date(e.created_at).toLocaleString()} · {e.operation} · {e.outcome}<br/>Administrator: {e.actor}<br/>Reason: {e.reason}</p>)}</section>}
 <Dialog open={!!dialog} onOpenChange={open=>!open&&!mutation.current&&setDialog(null)}><DialogContent className="max-h-[85dvh] overflow-y-auto"><DialogTitle>Confirm {dialog?.action.replaceAll('_',' ')}</DialogTitle><DialogDescription>This changes the selected content or membership and records your administrator identity and reason.</DialogDescription><label>Audit reason<textarea className={field+' w-full'} value={reason} maxLength={1000} onChange={e=>setReason(e.target.value)}/></label>{dialog?.action==='remove'&&<label>Type REMOVE {dialog.row.id}<input className={field+' w-full'} value={typed} onChange={e=>setTyped(e.target.value)}/></label>}{error&&<p role="alert">{error}</p>}<Button disabled={busy||!reason.trim()||(dialog?.action==='remove'&&typed!=='REMOVE '+dialog.row.id)} onClick={apply}>Confirm action</Button></DialogContent></Dialog>
 </section>;
}
