import { readExplorerRows } from '@/lib/passport/response';
import { MAIN_PASSPORT, usePassportScope } from '@/lib/passport/runtime';
import {ISOLATED_APP_BUILD} from '@/lib/isolated-app/active.mjs';
import {useEffect,useRef} from 'react';
import { bindRequestScope, matchesScope, scopeChanged, verifyCurrentScope } from '@/lib/passport/response';
import {useQuery, useQueryClient} from '@tanstack/react-query';
import {useSafety} from '@/lib/safety-store';
import {useAuth} from '@/lib/AuthContext';
import {callSupabaseRpc} from '@/api/supabaseClient';
import {supabaseConfig} from '@/config/supabase-config';
import {withTimeout} from '@/lib/bounded-operation';
import {useFeedRefresh,rotateFeed} from '@/lib/feed-refresh';

export const nmoodPostsEnabled=ISOLATED_APP_BUILD || MAIN_PASSPORT ? true : ((import.meta.env.MODE==='rehearsal' && supabaseConfig.target==='rehearsal') || (import.meta.env.MODE==='production' && supabaseConfig.target==='production')) && supabaseConfig.projectRef==='vudvrofhxwopgbldunky' && supabaseConfig.baseUrl==='https://vudvrofhxwopgbldunky.supabase.co';
export const nmoodQueryKey=(userId,scope)=>['nmoodPosts',userId,...(MAIN_PASSPORT ? [scope?.country || null,scope?.city || null,scope?.fingerprint || null] : [])];
export function newestNmoods(rows,now=Date.now()) {
 return [...new Map(rows.filter(p=>p?.id && !p.deleted_at && Date.parse(p.expires_at)>now).map(p=>[p.id,p])).values()]
  .sort((a,b)=>Date.parse(b.created_at)-Date.parse(a.created_at)||b.id.localeCompare(a.id));
}
export function nmoodBackendUnavailable(error) {
 return error?.code === 'PGRST202' || error?.status === 404 || /nmood_(list_main_posts|publish_main_post|update_main_post|delete_main_post)|function.*(does not exist|not found)/i.test(String(error?.message || ''));
}

export function normalizeNmoodPage(page) {
 if (!Array.isArray(page)) throw new Error('Nmoods unavailable');
 return page.map((row) => row?.nmood_list_main_posts ?? row?.nmood_post ?? row).filter((row) => row && typeof row === 'object');
}

export async function loadNmoodDetail(userId, postId, signal) {
 if (!postId) return null;
 const page = await withTimeout(timeoutSignal => callSupabaseRpc('nmood_list_main_posts', { p_before_time: null, p_before_id: null, p_id: postId }, { signal: signal || timeoutSignal, expectedUserId: userId }), 15000);
 return normalizeNmoodPage(page).find(post => post.id === postId) || null;
}

export async function loadNmoodPosts(userId,signal) {
 let cursor=null;const rows=[];const seen=new Set();
 for(;;) {
  const page=await withTimeout(timeoutSignal=>(MAIN_PASSPORT ? readExplorerRows('posts',{p_before_time:cursor?.created_at||null,p_before_id:cursor?.id||null,p_id:null},signal||timeoutSignal) : callSupabaseRpc('nmood_list_main_posts',{p_before_time:cursor?.created_at||null,p_before_id:cursor?.id||null,p_id:null},{signal:signal||timeoutSignal,expectedUserId:userId})),15000);
  const normalized=normalizeNmoodPage(page);
  rows.push(...normalized);
  if(normalized.length<100)break;
  const next=normalized.at(-1);if(!next?.id||seen.has(next.id))throw new Error('Nmoods unavailable');
  seen.add(next.id);cursor=next;
 }
 return newestNmoods(rows);
}
export function useNmoodPosts() {
 const {user}=useAuth();const client=useQueryClient();const scope=usePassportScope();const {isBlocked}=useSafety();
 const currentScope=useRef(scope.data);currentScope.current=scope.data;
 const query=useQuery({queryKey:nmoodQueryKey(user?.id,scope.data),enabled:nmoodPostsEnabled&&!!user?.id&&(!MAIN_PASSPORT||!!scope.data?.country&&!!scope.data?.fingerprint),
  queryFn:async({signal})=>{
   if(MAIN_PASSPORT)bindRequestScope(signal,scope.data);
   const loaded=await loadNmoodPosts(user.id,signal);
   const rows=MAIN_PASSPORT?loaded:rotateFeed(loaded);
   if(!MAIN_PASSPORT)return rows;
   await verifyCurrentScope(scope.data,signal);
   if(!matchesScope(scope.data,currentScope.current))throw scopeChanged();
   return {rows,scope:scope.data};
  },staleTime:0,gcTime:0,retry:false,refetchOnMount:'always',refetchOnWindowFocus:false,refetchOnReconnect:false,networkMode:'always'});
 useFeedRefresh(nmoodPostsEnabled&&!!user?.id);
 const visible=MAIN_PASSPORT?(!query.isError&&matchesScope(query.data?.scope,scope.data)?query.data.rows:[]):(query.data||[]);
 const posts=visible.filter(p=>!p.deleted_at&&Date.parse(p.expires_at)>Date.now()&&!isBlocked(p.owner_id));
 useEffect(()=>{
  if(!posts.length)return;
  const delay=Math.max(0,Math.min(...posts.map(p=>Date.parse(p.expires_at)))-Date.now());
  const timer=setTimeout(()=>{client.setQueryData(nmoodQueryKey(user?.id,scope.data),old=>MAIN_PASSPORT?(old?.rows?{...old,rows:old.rows.filter(p=>!p.deleted_at&&Date.parse(p.expires_at)>Date.now())}:old):(old||[]).filter(p=>!p.deleted_at&&Date.parse(p.expires_at)>Date.now()));},Math.min(delay+10,2147483647));
  return ()=>clearTimeout(timer);
 },[query.data,user?.id,client,scope.data?.country,scope.data?.city,scope.data?.fingerprint]); // expiry only, no polling
 const unavailable=!nmoodPostsEnabled || !user?.id || nmoodBackendUnavailable(query.error);
 return {posts:MAIN_PASSPORT&&!scope.data?.country?[]:posts,loading:(MAIN_PASSPORT&&scope.isPending)||query.isFetching&&!query.data,error:(MAIN_PASSPORT&&(scope.isError||!scope.isPending&&!scope.data?.country))||query.isError&&!unavailable,unavailable,refresh:query.refetch};
}
export function nmoodPayload(draft) {
 const data={intention_text:draft.intention.trim(),category:draft.category,hide_exact_location:draft.hideLocation,
  when:draft.when,custom_date:draft.customDate,custom_time:draft.customTime,looking_for:draft.lookingFor,
  group_size:draft.groupSize,gender:draft.gender,languages:draft.languages,tags:draft.tags,visibility:draft.visibility,
  expiration_hours:Number(draft.expiration.replace('h',''))};
 if(draft.ageRange){data.age_min=draft.ageRange[0];data.age_max=draft.ageRange[1];}
 if(!draft.hideLocation){data.location_name=draft.locationName;if(draft.point){data.point_lat=draft.point.lat;data.point_lng=draft.point.lng;}}
 return data;
}
export async function publishNmoodPost(userId,requestId,data) {
 if(!nmoodPostsEnabled||!userId)throw new Error('Publishing unavailable');
 const result=await withTimeout(signal=>callSupabaseRpc('nmood_publish_main_post',{p_request_id:requestId,p_data:data},{signal,expectedUserId:userId}),15000);
 if(!result?.id||!result.created_at||!result.expires_at)throw new Error('Publication not confirmed');
 window.dispatchEvent(new Event('nmood:nmood-posts-changed'));
 return result;
}

export async function updateNmoodPost(userId, postId, data) {
 if (!nmoodPostsEnabled || !userId) throw new Error('Publishing unavailable');
 const result = await withTimeout(signal => callSupabaseRpc('nmood_update_main_post', { p_id: postId, p_data: data }, { signal, expectedUserId: userId }), 15000);
 window.dispatchEvent(new Event('nmood:nmood-posts-changed'));
 return result;
}

export async function deleteNmoodPost(userId, postId) {
 if (!nmoodPostsEnabled || !userId) throw new Error('Publishing unavailable');
 const result = await withTimeout(signal => callSupabaseRpc('nmood_delete_main_post', { p_id: postId }, { signal, expectedUserId: userId }), 15000);
 window.dispatchEvent(new Event('nmood:nmood-posts-changed'));
 return result;
}
