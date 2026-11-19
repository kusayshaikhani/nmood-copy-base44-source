import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { getMySupportThread, listMySupportMessages, markMySupportRead, sendSupportMessage, startSupportThread, notifySupportChanged } from '@/lib/support-conversation';

export default function SupportConversation({supportMailto}) {
 const [thread,setThread]=useState(null),[messages,setMessages]=useState([]),[body,setBody]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const threadRef=useRef(null),sending=useRef(false),mounted=useRef(false),generation=useRef(0),viewport=useRef(null),request=useRef(null),readSnapshot=useRef('');
 const refresh=useCallback(async()=>{
  // One read in flight. A forced post-send refresh is queued after it settles.
  if(request.current)return request.current;
  const epoch=generation.current;
  const work=(async()=>{
   const current=await getMySupportThread();
   if(!mounted.current||epoch!==generation.current)return;
   threadRef.current=current;setThread(current);
   if(!current?.id)return;
   const rows=await listMySupportMessages(current.id);
   if(!mounted.current||epoch!==generation.current||threadRef.current?.id!==current.id)return;
   setMessages(rows);setError('');
   const snapshot=current.id+':'+rows.map(row=>row.id).join(',');
   if(snapshot!==readSnapshot.current){await markMySupportRead(current.id);readSnapshot.current=snapshot;}
  })();
  request.current=work;
  try{await work;}finally{if(request.current===work)request.current=null;}
 },[]);
 useEffect(()=>{
  mounted.current=true;generation.current++;
  const update=()=>{if(!document.hidden)void refresh().catch(()=>{if(mounted.current)setError('Support chat couldn’t refresh. Your conversation is saved.');});};
  update();const timer=window.setInterval(update,45000);
  window.addEventListener('focus',update);window.addEventListener('nmood:support-changed',update);document.addEventListener('visibilitychange',update);
  return()=>{mounted.current=false;generation.current++;window.clearInterval(timer);window.removeEventListener('focus',update);window.removeEventListener('nmood:support-changed',update);document.removeEventListener('visibilitychange',update);};
 },[refresh]);
 useEffect(()=>{if(viewport.current)viewport.current.scrollTop=viewport.current.scrollHeight;},[messages]);
 const send=async()=>{
  const message=body.trim();if(!message||sending.current)return;
  sending.current=true;setBusy(true);setError('');const epoch=generation.current;
  try{
   if(request.current)await request.current;
   if(!mounted.current||epoch!==generation.current)return;
   const current=threadRef.current;
   if(current?.id)await sendSupportMessage(current.id,message);
   else {const created=await startSupportThread(message);if(mounted.current&&epoch===generation.current){threadRef.current=created;setThread(created);}}
   if(!mounted.current||epoch!==generation.current)return;
   setBody('');
   // Rendering failure must not report a successfully sent message as failed.
   try{if(request.current)await request.current;await refresh();}catch{setError('Message sent. Your conversation will refresh shortly.');}
   notifySupportChanged();
  }catch{if(mounted.current&&epoch===generation.current)setError('We could not send that message. Please try again when you’re ready.');}
  finally{sending.current=false;if(mounted.current&&epoch===generation.current)setBusy(false);}
 };
 return <div className="space-y-3">
  <div ref={viewport} role="log" aria-label="Your Support conversation" aria-live="polite" className="max-h-96 space-y-2 overflow-y-auto rounded-xl bg-muted/30 p-3">
   {!messages.length?<p className="text-sm text-muted-foreground">Start a private conversation with Nmood Support.</p>:messages.map(message=><div key={message.id} className={`max-w-[85%] rounded-xl p-3 text-sm whitespace-pre-wrap break-words [overflow-wrap:anywhere] ${message.author_role==='member'?'ml-auto bg-primary text-primary-foreground':'bg-card border border-border'}`}><p className="mb-1 text-xs font-semibold">{message.author_role==='member'?'You':'Nmood Support'}</p>{message.body}</div>)}
  </div>
  <label className="sr-only" htmlFor="member-support-message">Message Nmood Support</label><textarea id="member-support-message" value={body} onChange={e=>setBody(e.target.value)} maxLength={2000} rows={3} className="w-full rounded-xl border border-input bg-background p-3 text-base" placeholder="Message Nmood Support"/>
  {error&&<p role="alert" className="text-sm text-destructive">{error} {supportMailto&&<a href={supportMailto} className="underline">Email support</a>}</p>}
  <Button onClick={send} disabled={!body.trim()||busy}>{busy?'Sending…':thread?'Send message':'Start support conversation'}</Button>
 </div>;
}
