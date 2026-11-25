import { readExplorerRows } from '@/lib/passport/response';
import { MAIN_PASSPORT, usePassportScope } from '@/lib/passport/runtime';
import {ISOLATED_APP_BUILD} from '@/lib/isolated-app/active.mjs';
import {useEffect,useRef} from 'react';
import { bindRequestScope, matchesScope, scopeChanged, verifyCurrentScope } from '@/lib/passport/response';
import {useQuery, useQueryClient} from '@tanstack/react-query';
import {useSafety} from '@/lib/safety-store';
import {useAuth} from '@/lib/AuthContext';
import {callSupabaseRpc,getSupabaseSession} from '@/api/supabaseClient';
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
 const data={intention_text:draft.intention.trim(),category:draft.category,hide_exact_location:!!draft.hideLocation,
  visibility:draft.visibility||'public',expiration_hours:Number(String(draft.expiration||'24h').replace('h',''))};
 for(const [key,value] of Object.entries({when:draft.when,custom_date:draft.customDate,custom_time:draft.customTime,group_size:draft.groupSize,gender:draft.gender})){
  if(typeof value==='string'&&value.trim())data[key]=value.trim();
 }
 if(draft.ageRange){data.age_min=draft.ageRange[0];data.age_max=draft.ageRange[1];}
 if(Number.isInteger(draft.maxParticipants)&&draft.maxParticipants>=1&&draft.maxParticipants<=1000)data.max_participants=draft.maxParticipants;
 if(draft.imagePath)data.image_path=draft.imagePath;
 if(!draft.hideLocation){if(typeof draft.locationName==='string'&&draft.locationName.trim())data.location_name=draft.locationName.trim();if(draft.point){data.point_lat=draft.point.lat;data.point_lng=draft.point.lng;}}
 return data;
}

/** Returns a short-lived URL only after Storage re-checks the viewer's Share access. */
export async function getNmoodShareImageUrl(path,{expectedUserId}={}) {
 if(typeof path!=='string'||!/^[0-9a-f-]{36}\/[A-Za-z0-9._-]+$/i.test(path)) return null;
 const session=getSupabaseSession();const userId=session?.user?.id;
 if(!session?.access_token||!userId||expectedUserId&&userId!==expectedUserId)return null;
 const safePath=path.split('/').map(encodeURIComponent).join('/');
 const response=await fetch(`${supabaseConfig.baseUrl}/storage/v1/object/sign/nmood-share-images/${safePath}`,{method:'POST',headers:{apikey:supabaseConfig.publishableKey,Authorization:`Bearer ${session.access_token}`,'Content-Type':'application/json'},body:JSON.stringify({expiresIn:600})});
 if(!response.ok)return null;
 const result=await response.json().catch(()=>null);const signed=result?.signedURL||result?.signedUrl;
 if(typeof signed!=='string'||!signed)return null;
 return /^https?:\/\//i.test(signed)?signed:`${supabaseConfig.baseUrl}/storage/v1${signed.startsWith('/')?'':'/'}${signed}`;
}

/** Uploads an optional Share image to its private, owner-scoped bucket. */
export async function uploadNmoodShareImage(file,{expectedUserId}={}) {
 if(!file || !/^image\/(jpeg|png|webp)$/i.test(file.type||'')) throw new Error('Choose a JPG, PNG, or WebP image.');
 if(file.size>10*1024*1024) throw new Error('Choose an image smaller than 10 MB.');
 const session=getSupabaseSession(); const userId=session?.user?.id;
 if(!session?.access_token||!userId||expectedUserId&&userId!==expectedUserId) throw new Error('Please sign in again before uploading an image.');
 const extension=(file.name?.split('.').pop()||'jpg').replace(/[^a-z0-9]/gi,'').toLowerCase()||'jpg';
 const path=`${userId}/${crypto.randomUUID()}.${extension}`;
 const response=await fetch(`${supabaseConfig.baseUrl}/storage/v1/object/nmood-share-images/${path}`,{method:'POST',headers:{apikey:supabaseConfig.publishableKey,Authorization:`Bearer ${session.access_token}`,'Content-Type':file.type,'x-upsert':'false'},body:file});
 if(!response.ok) throw new Error('We could not upload that image. Please try again.');
 return path;
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
