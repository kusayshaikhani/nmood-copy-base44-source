import {getAdminSupportUnreadCount} from '@/lib/support-conversation';
import { MAIN_PASSPORT } from '@/lib/passport/enabled';
import {getSystemUnreadCount} from '@/lib/system-communications';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { getMyUnreadDirectMessageCount } from '@/api/supabaseClient';

const state={uid:null,count:0,loading:false};
const subscribers=new Set();
let promise=null;
let promiseUid=null;
let timer=null;
let installed=false;
const AUTOMATIC_REFRESH_INTERVAL=45_000;
let lastAutomaticRefreshAt=0;
const emit=()=>subscribers.forEach((fn)=>fn());
const set=(patch)=>{Object.assign(state,patch);emit();};

export async function refreshUnreadMessageCount(){
 if(!state.uid)return 0;
 const uid=state.uid;
 if(promise&&promiseUid===uid)return promise;
 promiseUid=uid;
 const current=Promise.all([getMyUnreadDirectMessageCount(),MAIN_PASSPORT?getSystemUnreadCount(uid).catch(()=>0):Promise.resolve(0),getAdminSupportUnreadCount().catch(()=>0)]).then(([direct,system,support])=>Number(direct||0)+system+support).then((count)=>{if(state.uid===uid)set({count:Number(count)||0,loading:false});return state.count;}).catch(()=>{if(state.uid===uid)set({loading:false});return state.count;}).finally(()=>{if(promise===current)promise=null;});
 promise=current;
 return current;
}

function refreshUnreadMessagesAutomatically(){
 const now=Date.now();
 if(now-lastAutomaticRefreshAt<AUTOMATIC_REFRESH_INTERVAL)return Promise.resolve(state.count);
 lastAutomaticRefreshAt=now;
 return refreshUnreadMessageCount();
}

export function notifyConversationRead(){
 window.dispatchEvent(new CustomEvent('nmood:messages-changed'));
 return refreshUnreadMessageCount();
}

function bind(user){
 const uid=user?.id?String(user.id):null;
 if(state.uid!==uid)set({uid,count:0,loading:!!uid});
 if(!uid)return;
 if(!installed){
  window.addEventListener('nmood:messages-changed',refreshUnreadMessageCount);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)void refreshUnreadMessagesAutomatically();});
  installed=true;
 }
 if(!timer)timer=window.setInterval(()=>{if(!document.hidden)void refreshUnreadMessagesAutomatically();},AUTOMATIC_REFRESH_INTERVAL);
 refreshUnreadMessageCount();
}

export const formatUnreadMessageCount=(count)=>count>99?'99+':String(Math.max(0,Number(count)||0));
export function useUnreadMessageCount(){
 const{user}=useAuth();const[,render]=useState(0);
 useEffect(()=>{const fn=()=>render((v)=>v+1);subscribers.add(fn);return()=>subscribers.delete(fn);},[]);
 useEffect(()=>bind(user),[user?.id]);
 return state.count;
}
