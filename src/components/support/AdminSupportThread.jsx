import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { adminListSupportThreads, adminListSupportMessages, adminReplySupport, canReadAdminSupport, notifySupportChanged } from '@/lib/support-conversation';

export default function AdminSupportThread() {
  const { threadId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages,setMessages]=useState([]);
  const [identity,setIdentity]=useState(null);
  const [allowed,setAllowed]=useState(false);
  const [loading,setLoading]=useState(true);
  const [body,setBody]=useState('');
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const current=useRef(''); current.current=`${user?.id}:${threadId}`;
  const flight=useRef(false); const reading=useRef(false);
  const refresh=useCallback(async()=>{
    const key=`${user?.id}:${threadId}`;
    if(!user?.id || reading.current)return;
    reading.current=true;
    try{
      if(!await canReadAdminSupport())throw Error('denied');
      const rows=await adminListSupportMessages(threadId);
      if(current.current!==key)return;
      setAllowed(true);setMessages(rows);setError('');notifySupportChanged();
    }catch{if(current.current===key){setAllowed(false);setMessages([]);setError('This support conversation could not be opened.');}}
    finally{reading.current=false;if(current.current===key)setLoading(false);}
  },[user?.id,threadId]);
  useEffect(()=>{
    setAllowed(false);setMessages([]);setBody('');setLoading(true);setIdentity(null);void refresh();
    const key=current.current;void canReadAdminSupport().then(ok=>ok?adminListSupportThreads():[]).then(threads=>{if(current.current===key)setIdentity(threads.find(t=>String(t.id)===String(threadId))||null);}).catch(()=>{});
    const timer=window.setInterval(()=>{if(!document.hidden)void refresh();},45000);
    return()=>{window.clearInterval(timer);current.current='';};
  },[refresh]);
  const send=async()=>{
    if(flight.current||!allowed||!body.trim())return;
    flight.current=true;setBusy(true);setError('');const key=current.current;
    try{await adminReplySupport(threadId,body.trim());if(current.current===key){setBody('');notifySupportChanged();await refresh();}}
    catch{if(current.current===key)setError('Your reply could not be sent. Please try again when you’re ready.');}
    finally{flight.current=false;if(current.current===key)setBusy(false);}
  };
  return <main className="mx-auto min-h-screen w-full max-w-2xl px-4 pt-[max(1rem,env(safe-area-inset-top,0px))] pb-[calc(7rem+env(safe-area-inset-bottom,0px))]">
    <button onClick={()=>navigate('/messages')} className="min-h-11 flex items-center gap-2 text-sm"><ArrowLeft className="h-4 w-4"/>Messages</button>
    <h1 className="text-2xl font-semibold mt-3">{identity?.member_name||'Support conversation'}</h1><p className="text-sm text-muted-foreground mb-5">Reply to this member’s existing support conversation.</p>
    {loading?<p role="status">Loading conversation…</p>:null}
    {error?<p role="alert" className="rounded-xl border p-3 text-sm mb-3">{error}</p>:null}
    {allowed?<><div aria-live="polite" className="space-y-3 rounded-2xl border bg-card p-3 min-w-0">
      {messages.map(message=><div key={message.id} className={`max-w-[90%] rounded-xl p-3 whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-sm ${message.author_role==='support'?'ml-auto bg-primary text-primary-foreground':'bg-muted text-foreground'}`}><p className="text-xs font-semibold mb-1">{message.author_role==='support'?'Nmood Support':identity?.member_name||'Member'}</p>{message.body}</div>)}
      {!messages.length?<p className="text-sm text-muted-foreground">No messages in this conversation yet.</p>:null}
    </div><label htmlFor="support-reply" className="block text-sm font-medium mt-5 mb-2">Reply as Nmood Support</label><textarea id="support-reply" value={body} onChange={e=>setBody(e.target.value)} maxLength={2000} rows={3} className="block w-full min-w-0 rounded-xl border bg-background p-3 text-base"/>
    <button onClick={()=>void send()} disabled={busy||!body.trim()} className="mt-3 min-h-12 w-full rounded-xl bg-primary text-primary-foreground disabled:opacity-50 flex items-center justify-center gap-2"><Send className="h-4 w-4"/>{busy?'Sending…':'Send reply'}</button></>:null}
  </main>;
}
