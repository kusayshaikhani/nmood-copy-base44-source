import React,{useEffect,useRef,useState} from 'react';
import {Link} from 'react-router-dom';
import {askNmoodAssistant} from '@/lib/nmood-assistant';
import AIActionDrafts from './AIActionDrafts';
import {planningPrompt} from '@/lib/si-routing';
export default function PlanningAnswer({question,identity,submission,enabled,onSettled}) {
 const [state,setState]=useState({});const started=useRef(new Map());
 useEffect(()=>{
  let current=true;setState({});
  if(!enabled||!submission)return;
  if(!identity){onSettled?.();return;}
  const key=JSON.stringify([identity,submission]);
  const timer=setTimeout(()=>{
   // Retain the same promise across effect reruns; never start a second paid request.
   if(!started.current.has(submission))started.current.set(submission,{identity,promise:askNmoodAssistant(planningPrompt(question),{requestId:submission})});
   const job=started.current.get(submission);if(job.identity!==identity)return;
   setState({key,pending:true});
   job.promise.then(reply=>{onSettled?.();if(current)setState({key,reply});},error=>{onSettled?.();if(current)setState({key,error:error.message,upgrade:error.upgradeAvailable});});
  },0);
  return()=>{current=false;clearTimeout(timer);if(!started.current.has(submission))onSettled?.();};
 },[enabled,identity,submission,question,onSettled]);
 if(enabled&&submission&&!identity)return <p role="status" className="rounded-3xl border bg-card p-5 text-sm">Sign in to Ask Nmood. Your question is kept here.</p>;
 if(!enabled||!identity||state.key!==JSON.stringify([identity,submission]))return null;
 return <section aria-label="AI planning answer" aria-live="polite" aria-busy={!!state.pending} className="min-w-0 space-y-3 rounded-3xl border bg-card p-5">
  <h2 className="text-xl font-bold">Your plan <span className="text-xs font-normal text-muted-foreground">AI planning answer</span></h2>
  {state.pending?<p role="status">Putting your plan together…</p>:state.reply?<><p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-sm leading-relaxed">{state.reply}</p><p className="text-xs leading-relaxed text-muted-foreground">All suggested spending is an estimate, not a venue quote. Check details before making plans.</p><AIActionDrafts identity={identity} answer={state.reply} question={question} answerRequestId={submission}/></>:<><p role="status" className="text-sm">{state.error}</p>{state.upgrade&&<Link className="inline-flex min-h-11 items-center text-primary" to="/upgrade">Explore Premium</Link>}</>}
 </section>;
}
