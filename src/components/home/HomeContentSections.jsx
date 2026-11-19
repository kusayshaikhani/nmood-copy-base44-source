import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Users } from 'lucide-react';
import { useCircleDiscovery } from '@/lib/circle-store';
import { useExperiences } from '@/lib/discover-store';
import DiscoveryStatus from '@/components/shared/DiscoveryStatus';
import SmartImage from '@/components/shared/SmartImage';
import RecentCarousel, { RecentHeading } from './premium/RecentCarousel';
import { HOME_LAYOUT } from './home-layout';

function ContentSection({title,to,items,loading,error,onRetry,Icon}) {
 const [visible,setVisible]=useState(6);
 const sorted=items;
 return <section aria-label={title}>
  <RecentHeading title={title} to={to}/>
  {loading||error?<DiscoveryStatus label={title} loading={loading} error={error} onRetry={onRetry}/>:!sorted.length?
   <p role="status" className="rounded-2xl bg-primary/5 p-4 text-sm text-muted-foreground">No {title.toLowerCase()} available yet.</p>:
   <><RecentCarousel label={`${title} carousel`}>{sorted.slice(0,visible).map(item=><li key={item.id} className={HOME_LAYOUT.card}>
    <Link to={item.route} className="flex w-full flex-col overflow-hidden rounded-2xl border border-primary/10 bg-primary/5 shadow-soft focus-visible:ring-2 focus-visible:ring-primary">
     <div className="aspect-[4/3] bg-primary/10"><SmartImage src={item.image} alt="" rounded="rounded-none" className="h-full w-full" fallback={<div className="flex h-full items-center justify-center text-primary/50"><Icon size={28} aria-hidden="true"/><span className="sr-only">No cover image</span></div>}/></div>
     <div className="min-w-0 p-3"><h3 className="text-sm font-semibold leading-snug break-words [overflow-wrap:anywhere]">{item.title}</h3>{item.location&&<p className="mt-1 text-xs text-muted-foreground break-words">{item.location}</p>}</div>
    </Link>
   </li>)}</RecentCarousel>{visible<sorted.length&&<button type="button" className="mx-auto mt-3 flex min-h-11 items-center text-primary" onClick={()=>setVisible(n=>n+6)}>Load more {title.toLowerCase()}</button>}</>}
 </section>;
}
export function HomeCircles(){
 const q=useCircleDiscovery();
 return <ContentSection title="Circles" to="/circles" Icon={Users} loading={q.loading} error={q.isError} onRetry={q.refetch} items={(q.circles||[]).map(c=>({...c,title:c.name,image:c.cover_photo,route:`/circle/${c.id}`}))}/>;
}
export function HomeExperiences(){
 const q=useExperiences();
 return <ContentSection title="Experiences" to="/experiences" Icon={CalendarDays} loading={q.loading} error={q.isError} onRetry={q.refetch} items={(q.experiences||[]).map(e=>({...e,image:e.image,route:`/experience/${e.id}`}))}/>;
}
