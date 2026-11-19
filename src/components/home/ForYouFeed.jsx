import React,{useEffect,useRef} from 'react';
import {Link} from 'react-router-dom';
import {RefreshCw,UsersRound,CalendarDays,Images,ArrowRight,Plus} from 'lucide-react';
import HomePersonCard from './HomePersonCard';
import {useHomeFeed} from '@/lib/use-home-feed';
import {markHomeViewed} from '@/lib/home-seen';
import {lazy,Suspense} from 'react';
const CreateNmoodFlow=lazy(()=>import('@/components/nmoods/CreateNmoodFlow'));
import {useState} from 'react';
import {SmartSearchCard} from '@/components/search/SmartSearchResults';
const sections={people:['People you may connect with','/explore?tab=people'],circles:['Circles for you','/circles'],experiences:['Experiences happening soon','/experiences'],posts:['Nmood Shares','/nmoods']};
function ViewedCard({actor,kind,row,rotation}){
 const element=useRef(null);
 useEffect(()=>{
  if(!actor||typeof IntersectionObserver==='undefined')return;
  let timer;let viewed=false;let visible=false;
  const update=()=>{clearTimeout(timer);if(visible&&!viewed&&document.visibilityState!=='hidden')timer=setTimeout(()=>{viewed=true;markHomeViewed(actor,`${kind}:${row.id}`);},750);};
  const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting&&entry.intersectionRatio>=0.6;update();},{threshold:0.6});
  observer.observe(element.current);document.addEventListener('visibilitychange',update);
  return()=>{clearTimeout(timer);observer.disconnect();document.removeEventListener('visibilitychange',update);};
 },[actor,kind,row.id,rotation]);
 return <li ref={element} className="flex min-w-0 flex-col">
  {kind==='people'?<HomePersonCard row={row}/>:<SmartSearchCard kind={kind} row={row} compact/>}
 </li>;

}
function DiscoveryEntry({kind,onCreateShare}) {
 const Icon=kind==='circles'?UsersRound:kind==='experiences'?CalendarDays:Images;
 const title=kind==='circles'?'Find your circle':kind==='experiences'?'Make a plan':'Share a moment';
 const description=kind==='circles'?'Connect around the things you enjoy.':kind==='experiences'?'Discover something to do together.':'Small moments can start a connection.';
 const explore=kind==='posts'?'View Nmood Shares':`Explore ${kind==='circles'?'Circles':'Experiences'}`;
 const create=kind==='circles'?'Create a Circle':kind==='experiences'?'Create an Experience':'Create a Nmood Share';
 const action='flex min-h-12 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold leading-5 text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';
 return <div data-discovery-entry={kind} className="rounded-3xl border border-primary/10 bg-card p-5 shadow-sm sm:p-6">
  <div className="flex items-start gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/5 text-primary"><Icon size={24} strokeWidth={1.75} aria-hidden="true"/></div><div className="min-w-0"><h3 className="text-lg font-semibold leading-6 tracking-tight">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p></div></div>
  <div className="mt-5 grid gap-2 border-t border-border/60 pt-4"><Link to={sections[kind][1]} className={`${action} justify-between bg-primary/5`}>{explore}<ArrowRight size={17} aria-hidden="true" className="shrink-0"/></Link>{kind==='posts'?<button type="button" onClick={onCreateShare} className={action}><Plus size={17} aria-hidden="true"/>{create}</button>:<Link to={kind==='circles'?'/host/create-circle':'/host/create'} className={action}><Plus size={17} aria-hidden="true"/>{create}</Link>}</div>
 </div>;
}
export default function ForYouFeed(){
 const [createShare,setCreateShare]=useState(false);
 const {groups,actor,rotation,loading,refreshing,error,scopeMissing,refresh}=useHomeFeed();
 return <div className="min-w-0 space-y-8" aria-busy={loading}>
  <div className="flex items-start justify-between gap-4 border-b border-border/60 pb-7"><div><h2 className="text-xl font-semibold leading-7 tracking-tight">Discover something new</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">People, plans and moments to make your day.</p></div><button type="button" onClick={refresh} disabled={loading||refreshing||scopeMissing} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-primary/10 bg-primary/5 text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50" aria-label="Refresh For You"><RefreshCw aria-hidden="true" size={19} className={loading||refreshing?'motion-safe:animate-spin':''}/></button></div>
  {loading?<div role="status" aria-label="Refreshing your feed" className="space-y-4"><span className="sr-only">Refreshing your feed…</span>{[0,1,2].map(i=><div key={i} aria-hidden="true" className="h-28 rounded-3xl bg-muted motion-safe:animate-pulse"/>)}</div>:error?<div role="alert" className="rounded-3xl border p-5 text-sm leading-relaxed"><p>Your feed couldn’t refresh. Please try again.</p><button type="button" onClick={refresh} className="mt-2 min-h-11 font-semibold text-primary">Try again</button></div>:scopeMissing?<p className="text-sm leading-relaxed text-muted-foreground">Choose your home country in <Link to="/settings" className="text-primary underline">Settings</Link> to discover your community.</p>:Object.keys(sections).map(kind=>({kind,rows:groups.find(g=>g.kind===kind)?.rows||[]})).filter(g=>g.kind!=='people'||g.rows.length>0).map(group=><section key={group.kind} aria-labelledby={`home-${group.kind}`} className="min-w-0 space-y-4">
   <div className="flex items-start justify-between gap-4"><h2 id={`home-${group.kind}`} className="max-w-[15rem] text-xl font-semibold leading-7 tracking-tight">{sections[group.kind][0]}</h2><Link to={sections[group.kind][1]} aria-label={`See all ${sections[group.kind][0]}`} className="-mt-1 flex min-h-11 shrink-0 items-center px-1 text-sm font-semibold text-primary">See all</Link></div>
   {group.rows.length>0?<div role="region" aria-label={`${sections[group.kind][0]} cards`} tabIndex={0} className="min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><ul className="discovery-grid">{group.rows.map(row=><ViewedCard key={row.id} actor={actor} kind={group.kind} row={row} rotation={rotation}/>)}</ul></div>:<DiscoveryEntry kind={group.kind} onCreateShare={()=>setCreateShare(true)}/>}

  </section>)}
  {createShare&&<Suspense fallback={<p role="status">Opening your Share…</p>}><CreateNmoodFlow open onClose={()=>setCreateShare(false)}/></Suspense>}
  {!loading&&!error&&!scopeMissing&&['circles','experiences','posts'].every(kind=>groups.some(g=>g.kind===kind&&g.rows.length))&&<div className="space-y-5 border-t border-border/60 pt-8"><h2 className="text-xl font-semibold leading-7 tracking-tight">Make a plan of your own</h2><nav aria-label="Create a plan" className="grid grid-cols-2 gap-3">{[{to:'/host/create-circle',label:'Create a Circle',Icon:UsersRound},{to:'/host/create',label:'Create an Experience',Icon:CalendarDays}].map(({to,label,Icon})=><Link key={to} to={to} className="flex min-h-32 flex-col items-start justify-between gap-4 rounded-3xl border border-primary/10 bg-primary/5 p-4 text-sm font-semibold leading-6 text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><Icon size={24} strokeWidth={1.75} aria-hidden="true"/>{label}</Link>)}</nav></div>}
 </div>;
}
