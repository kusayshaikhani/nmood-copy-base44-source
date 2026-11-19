import CompactProfile from '@/components/shared/CompactProfile';
import { MAIN_PASSPORT } from '@/lib/passport/enabled';
import { newestFirst } from '@/lib/passport/newest-first';
import { HOME_LAYOUT } from '../home-layout';
import React,{useState} from 'react';
import {Link} from 'react-router-dom';

import {useDiscoveryPeople} from '@/lib/use-discovery-people';
import DiscoveryStatus from '@/components/shared/DiscoveryStatus';



import {useAuth} from '@/lib/AuthContext';
import {useConnections} from '@/lib/connections-store';
import RecentCarousel,{RecentHeading,useRecentItems} from './RecentCarousel';

export function hasPendingOutgoingRequest(pal,outgoing=[]){
 const memberId=String(pal?.user_id||pal?.created_by_id||pal?.id||'');
 return Boolean(memberId)&&outgoing.some(request=>String(request?.receiver_user_id||request?.receiver_id||'')===memberId&&request?.status==='pending');
}

export function MemberCards({members,fullList,connections,label,indicatorHome}){
 const [visible,setVisible]=useState(6);const shown=members.slice(0,visible);
 return <><RecentCarousel label={label} fullList={fullList}>{shown.map(pal=>{
  const id=pal.user_id||pal.created_by_id||pal.id;
  return <li key={id} className={fullList?'min-w-0 flex':HOME_LAYOUT.card}><Link to={`/pal/${id}`} aria-label={pal.name} className="discovery-card compact-profile-link unified-card">
   <CompactProfile person={pal} memberId={id} home={indicatorHome}/>
  </Link></li>;
 })}</RecentCarousel>{shown.length<members.length&&<button type="button" className="mx-auto mt-3 flex min-h-11 text-primary" onClick={()=>setVisible(n=>n+12)}>Load more members</button>}</>;
}

export default function NewPalsSection({fullList=false}){
 const {user}=useAuth();const connections=useConnections(user);
 const recentQuery=useDiscoveryPeople({recentOnly:!MAIN_PASSPORT});
 // This is the same server-authorized discoverable projection used by People.
 // It is enabled only after the trusted recent list has resolved empty.
 const recent=useRecentItems(recentQuery.members||[]);
 const fallbackNeeded=!MAIN_PASSPORT&&!recentQuery.isLoading&&!recentQuery.isError&&recent.length===0;
 const fallbackQuery=useDiscoveryPeople({recentOnly:false,enabled:fallbackNeeded});
 const fallback=fallbackNeeded?(fallbackQuery.members||[]):[];
 const loading=recentQuery.isLoading||(fallbackNeeded&&fallbackQuery.isLoading);
 const error=recentQuery.isError||(fallbackNeeded&&fallbackQuery.isError);
 const shown=MAIN_PASSPORT?newestFirst(recentQuery.members||[]):recent.length?recent:fallback;const isFallback=recent.length===0&&fallback.length>0;
 return <section aria-label="New people">
  {fullList?<h1 className="text-2xl font-semibold">New people</h1>:<RecentHeading title="New people" to="/new-to-nmood"/>}
  <p className="mb-4 text-caption">{MAIN_PASSPORT?'Meet people in your selected area, newest first.':isFallback?'Meet members on Nmood':'Meet members who joined in the last 72 hours.'}</p>
  {error||loading?<DiscoveryStatus label="New people" error={error} loading={loading} onRetry={()=>{void recentQuery.refetch?.();if(recent.length===0)void fallbackQuery.refetch?.();}}/>:shown.length===0?
   <div role="status" className="rounded-2xl bg-primary/5 p-5 text-sm"><p className="font-semibold">{MAIN_PASSPORT?'No eligible people in your selected area yet':'No discoverable members yet'}</p><p className="mt-1 text-muted-foreground">Check back soon to meet members on Nmood.</p></div>:
   <><MemberCards members={shown} fullList={fullList} connections={connections} indicatorHome={!isFallback} label={fullList?(isFallback?'Meet members on Nmood':'New people members'):(isFallback?'Meet members on Nmood carousel':'New people carousel')}/></>}
 </section>;
}
