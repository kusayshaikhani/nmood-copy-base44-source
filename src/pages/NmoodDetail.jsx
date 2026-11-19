import {ShareAudienceControls} from '@/components/nmoods/ShareAccess';
import AdminDeleteAction from '@/components/admin/AdminDeleteAction';
import {useEffect,useState} from 'react';
import {useNavigate,useParams} from 'react-router-dom';
import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query';
import {CalendarDays,Flag,MapPin,MessageCircle,Users} from 'lucide-react';
import {Button} from '@/components/ui/button';
import ConnectButton from '@/components/connections/ConnectButton';
import ProfileAvatar from '@/components/profile/ProfileAvatar';
import ReportSheet from '@/components/safety/ReportSheet';
import {useMemberProfile} from '@/lib/member-profile-view';
import {useSafety} from '@/lib/safety-store';
import {useAuth} from '@/lib/AuthContext';
import {deleteNmoodPost,loadNmoodDetail,nmoodBackendUnavailable,nmoodPostsEnabled} from '@/lib/nmood-posts';
import {getDirectMessageAccess,getNmoodJoinState,requestToJoinNmood} from '@/api/supabaseClient';
import {resolveNmoodJoinCapability,resolveNmoodMessageCapability} from '@/lib/nmood-post-actions';

function displayTiming(post){
 if(post.when==='custom')return [post.custom_date,post.custom_time].filter(Boolean).join(' · ')||'Timing shared by the host';
 return post.when||null;
}

function MessageAction({memberId,post,isOwner,viewerId}){
 const navigate=useNavigate();
 const accessQuery=useQuery({queryKey:['nmoodDirectMessageAccess',viewerId,memberId],enabled:!!memberId&&!isOwner,retry:false,queryFn:()=>getDirectMessageAccess(String(memberId))});
 const capability=resolveNmoodMessageCapability({post,directMessageAccess:accessQuery.data,isOwner});
 if(capability.enabled)return <Button type="button" className="min-h-11" variant="secondary" onClick={()=>navigate(`/messages/${memberId}`)}><MessageCircle className="mr-2 h-4 w-4"/>Message</Button>;
 const explanation=accessQuery.isLoading?'Checking messaging availability…':capability.reason==='audience'?'Messaging is available to friends or an authorized audience only.':'Messaging is unavailable under this member’s safety or message settings.';
 return <div><Button type="button" className="min-h-11" variant="secondary" disabled aria-describedby="nmood-message-unavailable"><MessageCircle className="mr-2 h-4 w-4"/>Message</Button><p id="nmood-message-unavailable" className="mt-1 text-xs text-slate-600">{explanation}</p></div>;
}

function RequestToJoinAction({post,isOwner,viewerId}){
 const stateQuery=useQuery({queryKey:['nmoodJoinState',viewerId,post?.id],enabled:!!post?.id&&!isOwner,retry:false,queryFn:()=>getNmoodJoinState(post.id)});
 const requestMutation=useMutation({retry:false,mutationFn:()=>requestToJoinNmood(post.id),onSuccess:()=>stateQuery.refetch()});
 const capability=resolveNmoodJoinCapability({post,serverState:stateQuery.data,isOwner});
 const explanation=stateQuery.isLoading?'Checking request availability…':capability.reason==='pending'?'Your request is pending.':capability.reason==='accepted'?'Your request was accepted.':capability.reason==='server_contract_unavailable'?'Requests are temporarily unavailable.':'This request is unavailable under the Nmood’s safety or participation settings.';
 return <div><Button type="button" className="min-h-11 bg-indigo-700 text-white hover:bg-indigo-800" disabled={!capability.enabled||requestMutation.isPending} onClick={()=>requestMutation.mutate()} aria-describedby="nmood-join-unavailable">{requestMutation.isPending?'Requesting…':capability.reason==='pending'?'Requested':capability.reason==='accepted'?'Joined':'Request to join'}</Button>{!capability.enabled&&<p id="nmood-join-unavailable" className="mt-1 text-xs text-slate-600">{explanation}</p>}{requestMutation.isError&&<p role="alert" className="mt-1 text-xs text-destructive">The request could not be sent. Please try again.</p>}</div>;
}

export default function NmoodDetail(){
 const {id}=useParams();const {user}=useAuth();const navigate=useNavigate();const {isBlocked}=useSafety();const queryClient=useQueryClient();const [reportOpen,setReportOpen]=useState(false);
 const query=useQuery({queryKey:['nmoodPosts',user?.id,'detail',id],enabled:nmoodPostsEnabled&&!!user?.id&&!!id,retry:false,gcTime:0,staleTime:0,queryFn:({signal})=>loadNmoodDetail(user.id,id,signal)});
 const [,setClock]=useState(0);const post=query.data&&!isBlocked(query.data.owner_id)?query.data:null;const ownerId=post?.owner_id;
 // This projection is reached only after the server-authorized post lookup. It
 // never reads a table directly and returns a photo only when profile rules allow it.
 const profileQuery=useMemberProfile({userId:ownerId});const ownerProfile=profileQuery.data?.tier==='full'&&!profileQuery.data?.blocked?profileQuery.data.profile:null;
 const isOwner=!!post&&String(ownerId)===String(user?.id);const unavailable=nmoodBackendUnavailable(query.error);
 const deleteMutation=useMutation({retry:false,mutationFn:()=>deleteNmoodPost(user.id,post.id),onSuccess:async()=>{await queryClient.invalidateQueries({queryKey:['nmoodPosts',user?.id]});navigate('/nmoods',{replace:true});}});
 useEffect(()=>{if(!post?.expires_at)return;const delay=Date.parse(post.expires_at)-Date.now();if(delay<=0)return;const timer=setTimeout(()=>setClock(value=>value+1),Math.min(delay+10,2147483647));return()=>clearTimeout(timer);},[post?.expires_at]);
 const ownerName=ownerProfile?.display_name||ownerProfile?.name||post?.member_first_name||'Member';
 const ownerPhoto=ownerProfile?.photo_url||ownerProfile?.avatar_url||null;
 const capacity=Number.isFinite(post?.capacity)?post.capacity:null;const remaining=Number.isFinite(post?.remaining_places)?post.remaining_places:null;
 return <main className="mx-auto max-w-xl pb-52 pt-2"><div className="space-y-4 px-5">
  {query.isFetching?<p role="status">Loading Nmood…</p>:!nmoodPostsEnabled||unavailable?<div role="alert" className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-blue-950">Nmood sharing is unavailable in this rehearsal build.</div>:query.isError?<div role="alert">Nmood could not be loaded.<button type="button" className="ml-2 min-h-11 underline" onClick={()=>query.refetch()}>Try again</button></div>:!post||Date.parse(post.expires_at)<=Date.now()?<p role="status">This Nmood is unavailable, deleted, expired, or not accessible to you.</p>:<>
   <article className="relative overflow-hidden rounded-[2rem] border border-blue-300/30 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 p-6 text-white shadow-[0_18px_44px_rgba(49,46,129,0.30)]">
    <button type="button" aria-label={`Open ${ownerName}'s profile`} onClick={()=>navigate(isOwner?'/profile':`/pal/${encodeURIComponent(ownerId)}`)} className="absolute right-5 top-5 min-h-11 min-w-11 rounded-full ring-2 ring-white/90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"><ProfileAvatar src={ownerPhoto} alt={ownerPhoto?ownerName:''} initials={ownerName.slice(0,1)} className="h-11 w-11 border-2 border-white/70" fallbackClassName="bg-indigo-900 text-white"/></button>
    <p className="pr-14 text-sm font-semibold text-white">{post.category}</p><h1 className="mt-2 pr-8 text-3xl font-bold leading-tight text-white">{post.intention_text}</h1><p className="mt-3 text-base font-medium text-white">{ownerName}</p>
    {post.looking_for&&<p className="mt-4 text-sm font-medium text-white">Looking for: {post.looking_for}</p>}
    <section aria-labelledby="nmood-activity" className="mt-6 border-t border-white/30 pt-5"><h2 id="nmood-activity" className="text-lg font-bold text-white">Activity</h2><dl className="mt-3 grid gap-3 text-sm text-white sm:grid-cols-2">
      {displayTiming(post)&&<div className="flex gap-2"><CalendarDays aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0"/><div><dt className="font-semibold">Date and time</dt><dd>{displayTiming(post)}</dd></div></div>}
      {post.group_size&&<div className="flex gap-2"><Users aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0"/><div><dt className="font-semibold">Group preference</dt><dd>{post.group_size}</dd></div></div>}
      {capacity!==null&&<div><dt className="font-semibold">Capacity</dt><dd>{capacity}</dd></div>}
      {remaining!==null&&<div><dt className="font-semibold">Remaining places</dt><dd>{remaining}</dd></div>}
      {!!post.languages?.length&&<div><dt className="font-semibold">Languages</dt><dd>{post.languages.join(', ')}</dd></div>}
      {!!post.tags?.length&&<div><dt className="font-semibold">Tags</dt><dd>{post.tags.map(tag=>`#${tag}`).join(' ')}</dd></div>}
    </dl></section>
    <section aria-labelledby="nmood-location" className="mt-6 rounded-2xl border border-white/30 bg-slate-950/20 p-4"><div className="flex gap-3"><MapPin aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0"/><div><h2 id="nmood-location" className="font-bold text-white">Location</h2><p className="mt-1 text-sm text-white">{post.hide_exact_location?'The host has kept the location private.':'Location details are shared when a request is accepted.'}</p><p className="mt-2 text-xs text-white/85">A map preview is unavailable because this normal Nmood contract does not provide a privacy-classified public venue or approximate-area map payload.</p></div></div></section>
   </article>
   <ShareAudienceControls post={post}/><AdminDeleteAction entity="Nmood" id={post.id} onDeleted={()=>navigate('/nmoods',{replace:true})} />
   {isOwner&&<section aria-label="Owner actions" className="rounded-2xl border border-border bg-card p-4"><p className="text-sm text-muted-foreground">You created this Nmood.</p><Button type="button" variant="destructive" className="mt-3 min-h-11" disabled={deleteMutation.isPending} onClick={()=>{if(window.confirm('Delete this Nmood? This cannot be undone.'))deleteMutation.mutate();}}>{deleteMutation.isPending?'Deleting…':'Delete Nmood'}</Button>{deleteMutation.isError&&<p role="alert" className="mt-2 text-sm text-destructive">The Nmood could not be deleted. Please try again.</p>}</section>}
  </>}
  </div>
  {post&&!isOwner&&Date.parse(post.expires_at)>Date.now()&&<nav aria-label="Nmood actions" className="fixed inset-x-0 bottom-[calc(63px+env(safe-area-inset-bottom,0px))] z-20 border-t border-indigo-200 bg-white/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_28px_rgba(30,41,59,0.14)] backdrop-blur"><div className="mx-auto grid max-w-xl grid-cols-2 gap-2"><RequestToJoinAction post={post} isOwner={isOwner} viewerId={user?.id}/><MessageAction memberId={ownerId} post={post} isOwner={isOwner} viewerId={user?.id}/><ConnectButton member={{id:ownerId,name:ownerName,avatar:ownerPhoto}} label="Connect" size="default" className="min-h-11"/><Button type="button" variant="outline" className="min-h-11" onClick={()=>setReportOpen(true)}><Flag className="mr-2 h-4 w-4"/>Report</Button></div></nav>}
  <ReportSheet open={reportOpen} onOpenChange={setReportOpen} target={{type:'member',id:ownerId,name:ownerName,image:ownerPhoto}}/>
 </main>;
}
