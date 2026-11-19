import { MAIN_PASSPORT } from '@/lib/passport/enabled';
import { newestFirst } from '@/lib/passport/newest-first';
import React,{useState} from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Users, MapPin } from 'lucide-react';
import { useCircleDiscovery } from '@/lib/circle-store';
import { useExperiences } from '@/lib/discover-store';
import DiscoveryStatus from '@/components/shared/DiscoveryStatus';
import SmartImage from '@/components/shared/SmartImage';
import RecentCarousel, { RecentHeading, useRecentItems } from './RecentCarousel';

function Gallery({kind,items,visible,onMore}){
 const Icon=kind==='Circle'?Users:CalendarDays;
 const label=kind==='Circle'?'Circles':'Experiences';
 return <section aria-label={label}>
  <h3 className="mb-3 text-lg font-semibold">{label} on Nmood</h3>
  <RecentCarousel label={`${label} gallery`} fullList>
   {items.slice(0,visible).map(item=><li key={item.id} className="min-w-0 flex">
    <Link to={item.route} className="w-full overflow-hidden rounded-2xl border border-primary/10 bg-primary/5 shadow-soft transition-shadow hover:shadow-card focus-visible:ring-2 focus-visible:ring-primary">
     <div className="relative aspect-[4/3] bg-primary/10">
      <SmartImage src={item.image} alt="" rounded="rounded-none" className="h-full w-full" fallback={<div className="flex h-full items-center justify-center text-primary/50"><Icon size={32} aria-hidden="true"/><span className="sr-only">No cover image</span></div>}/>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent"/>
      <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-card/95 px-2 py-1 text-xs font-semibold text-primary"><Icon size={12} aria-hidden="true"/>{kind}</span>
     </div>
     <div className="min-w-0 p-3"><h4 className="text-sm font-semibold leading-snug whitespace-normal break-words [overflow-wrap:anywhere]">{item.title}</h4>{item.location&&<p className="mt-1 flex items-start gap-1 text-xs text-muted-foreground"><MapPin size={14} className="shrink-0" aria-hidden="true"/><span className="break-words [overflow-wrap:anywhere]">{item.location}</span></p>}</div>
    </Link>
   </li>)}
  </RecentCarousel>
  {visible<items.length&&<button type="button" className="mx-auto mt-3 flex min-h-11 text-primary" onClick={onMore}>Load more {label}</button>}
 </section>;
}

export default function TodaysNmoodSection(){
 const circles=useCircleDiscovery();const experiences=useExperiences();
 const [circleVisible,setCircleVisible]=useState(6);const [experienceVisible,setExperienceVisible]=useState(6);
 const circleItems=newestFirst(circles.circles.map(c=>({...c,created_at:c.created_date||c.created_at,kind:'Circle',title:c.name,image:c.cover_photo,route:`/circle/${c.id}`})));
 const experienceItems=newestFirst(experiences.experiences.map(e=>({...e,created_at:e.created_date||e.created_at,kind:'Experience',title:e.title,image:e.image,route:`/experience/${e.id}`})));
 const recentCircles=useRecentItems(circleItems);const recentExperiences=useRecentItems(experienceItems);
 // A type with no new items falls back only to the same authorized type, never a mixed feed.
 const displayedCircles=MAIN_PASSPORT?circleItems:recentCircles.length?recentCircles:circleItems;
 const displayedExperiences=MAIN_PASSPORT?experienceItems:recentExperiences.length?recentExperiences:experienceItems;
 const settled=!circles.loading&&!experiences.loading&&!circles.isError&&!experiences.isError;
 return <section aria-label="Today’s Nmood" className="space-y-6">
  <div><RecentHeading title="Today’s Nmood"/><p className="text-caption">Newest eligible Circles and Experiences appear first, followed by older items in your selected area.</p></div>
  {[[circles,'Circles'],[experiences,'Experiences']].map(([query,label])=>(query.loading||query.isError)&&<DiscoveryStatus key={label} label={label} loading={query.loading} error={query.isError} onRetry={query.refetch}/>)}
  {displayedCircles.length>0&&<Gallery kind="Circle" items={displayedCircles} visible={circleVisible} onMore={()=>setCircleVisible(n=>n+6)}/>}
  {displayedExperiences.length>0&&<Gallery kind="Experience" items={displayedExperiences} visible={experienceVisible} onMore={()=>setExperienceVisible(n=>n+6)}/>}
  {settled&&!circleItems.length&&!experienceItems.length&&<div role="status" className="rounded-2xl bg-primary/5 p-5 text-sm"><p className="font-semibold">No eligible Circles or Experiences in your selected area yet</p><p className="mt-1 text-muted-foreground">Explore Circles and Experiences to find your next Nmood.</p></div>}
  <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm font-semibold text-primary"><Link to="/circles" className="inline-flex min-h-[44px] items-center rounded-lg focus-visible:ring-2 focus-visible:ring-primary">See all Circles</Link><Link to="/experiences" className="inline-flex min-h-[44px] items-center rounded-lg focus-visible:ring-2 focus-visible:ring-primary">See all Experiences</Link></div>
 </section>;
}
