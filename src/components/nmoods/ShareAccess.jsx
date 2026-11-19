import React,{useState,useRef} from 'react';
import {useQuery,useMutation,useQueryClient} from '@tanstack/react-query';
import {useNavigate} from 'react-router-dom';
import {callSupabaseRpc} from '@/api/supabaseClient';
import {useAuth} from '@/lib/AuthContext';
import {useConnections} from '@/lib/connections-store';
import {Button} from '@/components/ui/button';

export function ShareInvitations(){
 const {user}=useAuth();const navigate=useNavigate();const client=useQueryClient();const flight=useRef(false);
 const query=useQuery({queryKey:['shareInvitations',user?.id],enabled:!!user?.id,retry:false,queryFn:()=>callSupabaseRpc('nmood_my_share_invitations',{}, {expectedUserId:user.id})});
 const respond=useMutation({retry:false,mutationFn:async({id,accept})=>{if(flight.current)return;flight.current=true;try{return await callSupabaseRpc('nmood_respond_share_invitation',{p_post_id:id,p_accept:accept},{expectedUserId:user.id});}finally{flight.current=false;}},onSuccess:async(result,args)=>{if(!result)return;await client.invalidateQueries({queryKey:['shareInvitations',user.id]});await client.invalidateQueries({queryKey:['nmoodPosts',user.id]});if(result.status==='accepted')navigate('/nmood/'+encodeURIComponent(args.id));}});
 if(query.isError)return <p role="alert" className="px-5 text-sm">Share invitations could not be loaded. <button className="min-h-11 underline" onClick={()=>query.refetch()}>Try again</button></p>;
 if(!query.data?.length)return null;
 return <section aria-label="Share invitations" className="space-y-3 p-4">{query.data.map(i=><div key={i.post_id} className="rounded-2xl border bg-card p-4"><p className="font-semibold">Private Share invitation</p><p className="mt-1 text-sm text-muted-foreground">Accept to view this invite-only Share.</p><div className="mt-3 flex gap-2"><Button disabled={respond.isPending} onClick={()=>respond.mutate({id:i.post_id,accept:true})}>Accept</Button><Button variant="outline" disabled={respond.isPending} onClick={()=>respond.mutate({id:i.post_id,accept:false})}>Decline</Button></div></div>)}{respond.isError&&<p role="alert">The invitation could not be updated. Refresh and try again.</p>}</section>;
}
export function ShareAudienceControls({post}){
 const {user}=useAuth();const connections=useConnections(user);const [recipient,setRecipient]=useState('');const flight=useRef(false);
 const mutation=useMutation({retry:false,mutationFn:async()=>{if(flight.current||!recipient)return;flight.current=true;try{return await callSupabaseRpc('nmood_invite_to_share',{p_post_id:post.id,p_recipient_id:recipient},{expectedUserId:user.id});}finally{flight.current=false;}}});
 if(post?.owner_id!==user?.id||post.visibility!=='invite')return null;
 return <section className="space-y-3 rounded-2xl border bg-card p-4" aria-label="Invite a Pal to this Share"><h2 className="font-semibold">Invite a Pal</h2><p className="text-sm text-muted-foreground">Only Pals who accept your invitation can view this Share.</p><label className="block text-sm" htmlFor="share-recipient">Choose a Pal</label><select id="share-recipient" className="h-12 w-full rounded-xl border bg-background px-3 text-base" value={recipient} onChange={e=>{setRecipient(e.target.value);mutation.reset();}}><option value="">Select a Pal</option>{connections.connections.map(c=><option key={c.pal_user_id} value={c.pal_user_id}>{c.pal_name||'Pal'}</option>)}</select><Button disabled={!recipient||mutation.isPending||mutation.isSuccess} onClick={()=>mutation.mutate()}>{mutation.isSuccess?'Invited':'Send private invitation'}</Button>{mutation.isError&&<p role="alert">This invitation could not be sent.</p>}</section>;
}
