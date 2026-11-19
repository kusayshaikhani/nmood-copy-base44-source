import { suppressSelfActionNotifications } from './notification-self-actions';
import { getMyAnnouncements, markAnnouncement } from '@/api/mainOperations';
import { passportRuntime } from './passport-runtime';
import { useEffect, useState } from 'react';
import { AlertCircle, Bell, Calendar, MessageSquare, UserCheck, UserPlus } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { suppressCancelledConnectionRequestNotifications } from '@/lib/notification-cancellation';
import {
  callSupabaseRpc,
  setMyNotificationDismissed,
  getMyActivityNotifications,
  getMyNotificationUnreadCount,
  markActivityNotification,
  markAllActivityNotificationsRead,
} from '@/api/supabaseClient';

export const groupOrder=['today','yesterday','earlier_this_week','older'];
export const groupLabels={today:'today',yesterday:'yesterday',earlier_this_week:'earlier_this_week',older:'older'};
const state={items:[],unreadCount:0,loading:true,uid:null};
const subscribers=new Set();
let loadPromise=null;
let accessGeneration=0;
let pollTimer=null;
let visibilityInstalled=false;
const AUTOMATIC_REFRESH_INTERVAL=45_000;
let lastAutomaticRefreshAt=0;

const emit=()=>subscribers.forEach((fn)=>fn());
const setState=(patch)=>{Object.assign(state,patch);emit();};
const day=(value)=>{const d=new Date(value);d.setHours(0,0,0,0);return d.getTime();};
const group=(value)=>{const now=day(new Date()),created=day(value),d=86400000;if(created===now)return'today';if(created===now-d)return'yesterday';if(created>=now-d*7)return'earlier_this_week';return'older';};
const relative=(value)=>{const ms=Date.now()-new Date(value).getTime();if(!Number.isFinite(ms)||ms<0)return'';const min=Math.floor(ms/60000);if(min<1)return'Just now';if(min<60)return min+' min ago';const hours=Math.floor(min/60);if(hours<24)return hours+' hour'+(hours===1?'':'s')+' ago';const days=Math.floor(hours/24);return days===1?'Yesterday':days+' days ago';};
export const formatBadgeCount=(count)=>count>99?'99+':String(Math.max(0,Number(count)||0));

const eventMeta=(event)=>{
 if(event==='direct_message'||event==='message_reply')return{tab:'messages',icon:MessageSquare,bg:'bg-primary/10',color:'text-primary'};
 if(event.startsWith('circle_')||event.startsWith('experience_'))return{tab:'activities',icon:Calendar,bg:'bg-primary/10',color:'text-primary'};
 if(event==='connection_accepted')return{tab:'pals',icon:UserCheck,bg:'bg-success/10',color:'text-success'};
 if(event.startsWith('connection_'))return{tab:'pals',icon:UserPlus,bg:'bg-primary/10',color:'text-primary'};
 if(event==='profile_view')return{tab:'pals',icon:UserPlus,bg:'bg-primary/10',color:'text-primary'};
 if(event.includes('safety')||event.includes('block')||event.includes('report'))return{tab:'system',icon:AlertCircle,bg:'bg-destructive/10',color:'text-destructive'};
 return{tab:'system',icon:Bell,bg:'bg-muted',color:'text-muted-foreground'};
};

export function mapActivityNotification(record){
 const meta=eventMeta(String(record.event_type||''));
 return{_groupRequest:record.actionable_group_request===true,_locked:record.locked===true,id:String(record.id),_entityId:record.source_id,_type:record.event_type,_actorId:record.actor_id,_path:record.path,_actor:record.actor||null,_targetAvailable:record.target_available!==false,
  thumbnail:record.event_type==='profile_view'?record.actor?.photo_url||null:null,_sortTime:record.created_at,tab:meta.tab,icon:meta.icon,iconBg:meta.bg,iconColor:meta.color,
  title:record.title||'Nmood update',description:record.event_type==='connection_request'?'Requested to connect with you.':record.body||'',timestamp:relative(record.created_at),read:Boolean(record.read_at),group:group(record.created_at),
  actions:record.actionable_group_request===true?[{label:'Approve',variant:'primary',action:'approve_group_request'},{label:'Decline',variant:'secondary',action:'decline_group_request'}]:[{label:record.target_available===false?'Unavailable':'Open',variant:'primary',action:'open_activity'}]};
}

export function fromPhotoVerification(record){
 const data=record?.data||record||{};if(!['approved','rejected','needs_resubmission'].includes(data.status))return null;
 const approved=data.status==='approved';return{id:'photo-verification-'+record.id,_type:'photo_verification',tab:'system',icon:approved?UserCheck:AlertCircle,
  title:approved?'Photo verification approved':'Photo verification needs your attention',description:approved?'Your profile now shows the verified indicator.':'Please open your profile and resubmit a new photo.',
  timestamp:relative(data.reviewed_at||record.updated_at||record.created_at),read:false,group:group(data.reviewed_at||record.updated_at||record.created_at),actions:[]};
}

async function load(force=false){
 if(!state.uid)return;
 if(passportRuntime.enabled){try{passportRuntime.ticket(state.uid);}catch{return;}}
 if(loadPromise&&!force)return loadPromise;
 const uid=state.uid;const generation=accessGeneration;
 loadPromise=(async()=>{
  try{
   const [rows,,announcements,requests]=await Promise.all([getMyActivityNotifications(),getMyNotificationUnreadCount(),getMyAnnouncements(),callSupabaseRpc('nmood_pending_group_requests',{})]);
   if(state.uid!==uid||generation!==accessGeneration)return;
   const items=suppressSelfActionNotifications(suppressCancelledConnectionRequestNotifications([...rows.filter(row=>!requests.some(request=>request.source_id===row.source_id)),...announcements,...requests])).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).map(mapActivityNotification);
   // The server count can briefly include a cancelled request while the
   // cancellation transaction is being reconciled. The visible badge must
   // always agree with the safely filtered in-app list.
   setState({items,unreadCount:items.filter(item=>!item.read).length,loading:false,error:null});
  }catch(error){
   if(state.uid!==uid||generation!==accessGeneration)return;
   setState({loading:false,error:error?.message||'Notifications could not be refreshed.'});
  }finally{loadPromise=null;}
 })();
 return loadPromise;
}

export function refreshNotificationCenter(){return load(true);}
function refreshNotificationsAutomatically(){
 const now=Date.now();
 if(now-lastAutomaticRefreshAt<AUTOMATIC_REFRESH_INTERVAL)return;
 lastAutomaticRefreshAt=now;
 void load(true);
}
function optimistic(ids,read){
 const wanted=new Set(ids.map(String));const previous=state.items;
 const items=state.items.map((n)=>wanted.has(n.id)?{...n,read}:n);
 const delta=previous.filter((n)=>wanted.has(n.id)&&n.read!==read).length;
 setState({items,unreadCount:Math.max(0,state.unreadCount+(read?-delta:delta))});
 return previous;
}
const markOne=(id,read)=>String(id).startsWith('group-request:')?Promise.resolve():String(id).startsWith('announcement:')?markAnnouncement(id,read):markActivityNotification(id,read);
export async function markRead(id){const prev=optimistic([id],true),generation=accessGeneration,uid=state.uid;try{await markOne(id,true);}catch(error){if(generation===accessGeneration&&uid===state.uid)setState({items:prev});await load(true);throw error;}}
export async function markUnread(id){const prev=optimistic([id],false),generation=accessGeneration,uid=state.uid;try{await markOne(id,false);}catch(error){if(generation===accessGeneration&&uid===state.uid)setState({items:prev});await load(true);throw error;}}
export async function markAllRead(){const prev=state.items,generation=accessGeneration,uid=state.uid;setState({items:prev.map((n)=>({...n,read:true})),unreadCount:0});try{await Promise.all([markAllActivityNotificationsRead(),...prev.filter(n=>n.id.startsWith('announcement:')).map(n=>markAnnouncement(n.id,true))]);}catch(error){if(generation===accessGeneration&&uid===state.uid)setState({items:prev});await load(true);throw error;}}
export async function markSelectedAsRead(ids){const prev=optimistic(ids,true),generation=accessGeneration,uid=state.uid;try{await Promise.all(ids.map((id)=>markOne(id,true)));}catch(error){if(generation===accessGeneration&&uid===state.uid)setState({items:prev});await load(true);throw error;}}
export async function markSelectedAsUnread(ids){const prev=optimistic(ids,false),generation=accessGeneration,uid=state.uid;try{await Promise.all(ids.map((id)=>markOne(id,false)));}catch(error){if(generation===accessGeneration&&uid===state.uid)setState({items:prev});await load(true);throw error;}}
const dismissalOperations=new Map();
export async function deleteNotification(id){
 const uid=state.uid,key=uid+':'+id;
 if(!uid)return;
 if(dismissalOperations.has(key))return dismissalOperations.get(key);
 const task=(async()=>{
  if(String(id).startsWith('announcement:'))await markAnnouncement(id,null,true);else await setMyNotificationDismissed(id,true,{expectedUserId:uid});
  if(state.uid!==uid)return;
  accessGeneration++;await load(true);
  // Re-read through privacy-aware RPCs on Undo; never resurrect a cached identity.
  return async()=>{if(state.uid!==uid)throw new Error('Please reopen Notifications.');if(String(id).startsWith('announcement:'))await markAnnouncement(id,null,false);else await setMyNotificationDismissed(id,false,{expectedUserId:uid});if(state.uid===uid){accessGeneration++;await load(true);}};
 })();dismissalOperations.set(key,task);
 try{return await task;}finally{dismissalOperations.delete(key);}
}
export async function deleteSelected(ids){await Promise.all(ids.map(deleteNotification));}
function subscribe(fn){subscribers.add(fn);return()=>subscribers.delete(fn);}
function useShared(){
 const[,render]=useState(0);
 useEffect(()=>subscribe(()=>render((v)=>v+1)),[]);
}
function installRefresh(){
 if(!pollTimer)pollTimer=window.setInterval(()=>{if(!document.hidden)refreshNotificationsAutomatically();},AUTOMATIC_REFRESH_INTERVAL);
 if(!visibilityInstalled){window.addEventListener('nmood:region-visibility-withdrawn',()=>{if(passportRuntime.enabled){accessGeneration++;setState({items:[],unreadCount:0,loading:false});}});window.addEventListener('nmood:region-visibility-confirmed',()=>{if(passportRuntime.enabled)refreshNotificationsAutomatically();});document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshNotificationsAutomatically();});window.addEventListener('nmood:notifications-changed',()=>load(true));window.addEventListener('nmood:request-policy-changed',()=>load(true));window.addEventListener('nmood:access-changed',()=>{accessGeneration++;setState({items:[],unreadCount:0,loading:true});void load(true);});visibilityInstalled=true;}
}
function bindUser(user){
 const uid=user?.id?String(user.id):null;
 const changed=state.uid!==uid;
 if(changed)setState({uid,items:[],unreadCount:0,loading:!!uid,error:null});
 if(uid){installRefresh();load(changed);}
}
export function useNotifications(){
 const{user}=useAuth();useShared();useEffect(()=>bindUser(user),[user?.id]);
 return{items:state.items,unreadCount:state.unreadCount,loading:state.loading,error:state.error,groupOrder,groupLabels,markAllRead,markRead,markUnread,markSelectedAsRead,markSelectedAsUnread,deleteNotification,deleteSelected,removeItem:deleteNotification,refresh:refreshNotificationCenter};
}
export function useUnreadCount(){const{user}=useAuth();useShared();useEffect(()=>bindUser(user),[user?.id]);return state.unreadCount;}
