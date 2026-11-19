import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/lib/AuthContext';
import { MAIN_PASSPORT } from '@/lib/passport/enabled';
import { isOperationsAdmin, deletionConfirmation, canDeleteReviewedMember, deletionBlockMessage, deletionFailureMessage } from '@/lib/mission-control/operations';
import { previewMemberDeletion, deleteMemberPermanently } from '@/api/mainOperations';
export default function PermanentMemberDeletion({ member, onClose, onDeleted }) {
 const {user}=useAuth();const [plan,setPlan]=useState(null);const [notice,setNotice]=useState('');const [busy,setBusy]=useState(false);const [pending,setPending]=useState(false);const [complete,setComplete]=useState(false);const [revision,setRevision]=useState(0);
 const [typed,setTyped]=useState('');const [reason,setReason]=useState('');
 const generation=useRef(0),inFlight=useRef(false);
 const allowed=MAIN_PASSPORT&&isOperationsAdmin(user);
 useEffect(()=>{
  const g=++generation.current;setPlan(null);setPending(false);setComplete(false);setNotice('');setTyped('');setReason('');inFlight.current=false;
  if(!member?.id||!allowed){setBusy(false);return;}
  setBusy(true);
  previewMemberDeletion(member.id).then(p=>{if(g===generation.current){setPlan(p);if(!canDeleteReviewedMember(member.id,p))setNotice(deletionBlockMessage(p));}},()=>{if(g===generation.current)setNotice('Deletion availability could not be checked. No data was removed.');}).finally(()=>{if(g===generation.current)setBusy(false);});
  return()=>{generation.current++;};
 },[member?.id,user?.id,allowed,revision]);
 if(!member||!allowed)return null;
 const remove=async()=>{
  if(!canDeleteReviewedMember(member.id,plan)||typed!==deletionConfirmation(member.id)||!reason.trim()||busy||inFlight.current||complete)return;
  const g=generation.current;inFlight.current=true;setBusy(true);setNotice('');
  try{
   // The typed target and explicit confirmation preserve the server contract.
   // Identity, ownership, admin authority and plan freshness are rechecked there.
   const result=await deleteMemberPermanently(member.id,typed,reason.trim(),plan.fingerprint);
   if(g!==generation.current)return;
   if(result?.status==='COMPLETE'){setComplete(true);setPending(false);setNotice('Member permanently deleted.');onDeleted?.();}
   else if(result?.status==='CLEANUP_PENDING'){setPending(true);setNotice('Account data was removed. File and sign-in cleanup is pending. Continue cleanup to finish.');}
   else {setPlan(null);setPending(false);setNotice(result?.status==='FAILED_ROLLED_BACK'?deletionFailureMessage(result.failure_category):'Deletion outcome is unconfirmed. Do not start another deletion.');}
  }catch{if(g===generation.current){setPlan(null);setNotice('Deletion outcome is unconfirmed. Do not start another deletion.');}}
  finally{if(g===generation.current){inFlight.current=false;setBusy(false);}}
 };
 return <Dialog open onOpenChange={open=>!open&&!busy&&onClose()}><DialogContent className="max-h-[85vh] w-[calc(100%_-_2rem)] max-w-lg overflow-y-auto"><DialogHeader className="min-w-0 pr-12 text-left"><DialogTitle>Permanently Delete Member?</DialogTitle></DialogHeader>
 <DialogDescription>This permanently removes {member.display_name||member.full_name||'this member'}’s account, owned content, files, and sign-in access. This cannot be undone.</DialogDescription>
 {busy&&!inFlight.current&&<p role="status">Checking deletion availability…</p>}
 {notice&&<p role="status" className="break-words text-sm">{notice}</p>}
 {!busy&&!complete&&!plan&&!notice.startsWith('Deletion outcome')&&<button className="min-h-11 rounded-xl border px-4" onClick={()=>setRevision(v=>v+1)}>Check again</button>}
 {!complete&&<label className="space-y-2 text-sm">Type DELETE {member.id}<input className="min-h-11 w-full min-w-0 rounded-xl border px-3" value={typed} onChange={e=>setTyped(e.target.value)} autoCapitalize="off" autoCorrect="off" spellCheck={false} disabled={busy||pending}/></label>}
 {!complete&&<label className="space-y-2 text-sm">Audit reason<textarea className="min-h-20 w-full rounded-xl border p-3" value={reason} maxLength={500} onChange={e=>setReason(e.target.value)} disabled={busy||pending}/></label>}
 {!complete&&<button className="min-h-11 rounded-xl bg-destructive px-4 text-destructive-foreground disabled:opacity-50" disabled={busy||!reason.trim()||typed!==deletionConfirmation(member.id)||!canDeleteReviewedMember(member.id,plan)} onClick={remove}>{busy&&inFlight.current?'Deleting…':pending?'Continue cleanup':'Permanently Delete Member'}</button>}
 <button className="min-h-11 rounded-xl border px-4" disabled={busy&&inFlight.current} onClick={onClose}>{complete?'Done':'Cancel'}</button>
 </DialogContent></Dialog>;
}
