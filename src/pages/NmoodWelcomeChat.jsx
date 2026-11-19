import React,{useEffect,useState} from 'react';
import {Link,useSearchParams} from 'react-router-dom';
import {useAuth} from '@/lib/AuthContext';
import {MAIN_PASSPORT} from '@/lib/passport/enabled';
import {getSystemMessages,readSystemMessage,systemConversation} from '@/lib/system-communications';
import {notificationDestination} from '@/lib/notification-destination';
import {notifyConversationRead} from '@/lib/unread-messages-store';
export default function NmoodWelcomeChat(){
 const {user}=useAuth();const [params]=useSearchParams();const selected=params.get('message');
 const [state,setState]=useState({loading:true});const [revision,retry]=useState(0);
 useEffect(()=>{let active=true;setState({loading:true});
  if(!MAIN_PASSPORT||!user?.id){setState({loading:false,messages:[]});return;}
  void getSystemMessages(user.id).then(async rows=>{
   if(!active)return;
   const {messages}=systemConversation(rows);setState({loading:false,messages});
   // Opening one notification marks only that exact message; opening the conversation
   // marks the messages actually rendered. Retain failures for explicit retry.
   for(const message of messages.filter(m=>!m.read_at&&(!selected||selected===m.id))){
    if(!active)return;await readSystemMessage(user.id,message.id);
   }
   if(active){notifyConversationRead();setState({loading:false,messages:messages.map(m=>!selected||selected===m.id?{...m,read_at:m.read_at||new Date().toISOString()}:m)});}
  }).catch(()=>{if(active)setState(previous=>({...previous,loading:false,error:'Could not load or mark your messages as read.'}));});
  return()=>{active=false;};
 },[user?.id,selected,revision]);
 useEffect(()=>{if(!state.loading&&selected)document.getElementById('system-'+selected)?.scrollIntoView?.({block:'center'});},[selected,state.loading]);
 return <main className="mx-auto max-w-2xl px-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-[calc(7rem+env(safe-area-inset-bottom))]">
  <Link to="/messages" className="inline-flex min-h-11 items-center text-primary">Back to messages</Link>
  <h1 className="text-2xl font-semibold">Nmood Admin</h1><p className="text-sm text-muted-foreground">Your Nmood updates · Replies are not monitored here.</p>
  {state.loading&&<p role="status">Loading…</p>}
  {state.error&&<p role="alert">{state.error} <button className="min-h-11 underline" onClick={()=>retry(n=>n+1)}>Retry</button></p>}
  {!state.loading&&selected&&!state.messages?.some(m=>m.id===selected)&&<p role="status">This message is no longer available.</p>}
  {state.messages?.map(message=>{const destination=notificationDestination({_path:message.destination});return <article id={'system-'+message.id} key={message.id} aria-label={message.title} className={`mt-5 min-w-0 rounded-2xl bg-primary/10 p-5 ${selected===message.id?'ring-2 ring-primary':''}`}>
   <h2 className="font-semibold break-words">{message.title}</h2><p className="mt-2 whitespace-pre-line [overflow-wrap:anywhere]">{message.body}</p>
   {message.destination&&destination!=='/notifications'&&<Link className="mt-4 inline-flex min-h-11 items-center text-primary" to={destination}>{message.event_type==='welcome'?'Start exploring':'View details'}</Link>}
  </article>;})}
  {!state.loading&&!state.error&&!state.messages?.length&&!selected&&<p className="mt-5">No Nmood messages yet.</p>}
 </main>;
}
