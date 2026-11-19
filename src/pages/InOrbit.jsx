import {useDiscoveryState} from '@/lib/use-discovery-state';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Orbit, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useDiscoveryPeople } from '@/lib/use-discovery-people';
import { orbitBubbles } from '@/lib/resonance-discovery';
import ProfileAvatar from '@/components/profile/ProfileAvatar';
import MemberIndicators from '@/components/profile/MemberIndicators';
import { resolveMemberPhoto } from '@/lib/member-photo';
import constellationMood from '@/assets/in-orbit/in-orbit-constellation-moonlit-background.png';
import { INTEREST_NODE_OVERLAY_CLASS, interestArtwork } from '@/lib/interest-artwork';

const NODE_POSITIONS = [
 ['50%', '15%'], ['22%', '31%'], ['78%', '34%'], ['33%', '66%'], ['67%', '70%'], ['50%', '48%'],
];
const CONSTELLATION_LINKS = [[0, 1], [0, 2], [1, 3], [3, 4], [4, 2], [0, 5], [5, 3], [5, 4]];
const PAGE_SIZE = 12;
function InterestNodeArtwork({ interest }) {
 const artwork = interestArtwork(interest);
 const [source, setSource] = useState(artwork.src);
 useEffect(() => setSource(artwork.src), [artwork.src]);
 return <span data-testid="constellation-node-artwork" className="absolute inset-0 block overflow-hidden rounded-full [clip-path:circle(50%)]"><img src={source} alt="" aria-hidden="true" onError={() => setSource(current => current === artwork.fallbackSrc ? current : artwork.fallbackSrc)} className="block h-full w-full rounded-full object-cover" /></span>;
}

function PeopleGallery({ people, interest }) {
 const navigate = useNavigate();
 const [visible, setVisible] = useState(PAGE_SIZE);
 useEffect(() => setVisible(PAGE_SIZE), [interest]);
 const page = people.slice(0, visible);
 const more = visible < people.length;
 const loadMore = () => setVisible(count => Math.min(count + PAGE_SIZE, people.length));
 const handleScroll = (event) => {
  const node = event.currentTarget;
  if (more && node.scrollTop + node.clientHeight >= node.scrollHeight - 24) loadMore();
 };
 return <section aria-label={`People in ${interest}`} className="rounded-[1.75rem] border border-primary/15 bg-card p-4 shadow-[0_14px_34px_hsl(var(--primary)/.08)]">
   <div className="flex items-start justify-between gap-4 px-1 pb-3"><div><p className="flex items-center gap-1 text-xs font-medium text-primary"><Sparkles className="h-3.5 w-3.5"/>Selected constellation</p><h2 className="text-xl font-semibold">People in {interest}</h2></div><p className="pt-1 text-xs text-muted-foreground">{people.length} eligible</p></div>
   <div onScroll={handleScroll} className="max-h-[33rem] overflow-y-auto overscroll-contain pr-1" aria-live="polite">
    <div className="grid grid-cols-3 gap-2 sm:gap-3">{page.map(person => <button key={person.id} type="button" onClick={() => navigate(`/pal/${encodeURIComponent(person.id)}`)} className="group min-h-11 overflow-hidden rounded-2xl border border-primary/10 bg-muted/30 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"><div className="relative aspect-[3/4] bg-primary/10"><ProfileAvatar src={resolveMemberPhoto(person)} alt={person.name} initials={person.name?.slice(0, 1) || 'M'} className="h-full w-full rounded-none transition duration-200 motion-safe:group-hover:scale-[1.02]" fallbackClassName="h-full rounded-none bg-primary/10 text-primary"/><div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent px-2 pb-2 pt-10 text-white"><p className="truncate text-sm font-semibold">{person.name}{person.age != null ? `, ${person.age}` : ''}</p><MemberIndicators memberId={person.id} className="mt-0.5 line-clamp-2 text-[10px] leading-3 text-white/90"/></div></div></button>)}</div>
    {more && <button type="button" onClick={loadMore} className="mx-auto mt-4 flex min-h-11 items-center rounded-xl border border-primary/25 px-4 text-sm font-medium text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Load more people</button>}
   </div>
  </section>;
}

export default function InOrbit() {
 const { member,user } = useAuth();
 const { members, isLoading, isError, refetch } = useDiscoveryPeople();
 const bubbles = useMemo(() => orbitBubbles(members, member), [members, member]);
 const [saved,setSaved]=useDiscoveryState(user?.id,'orbit',{selected:''});
 const selected=saved.selected||'';const setSelected=value=>setSaved({selected:value});
 const effective = selected || bubbles[0] || '';
 const people = useMemo(() => members.filter(person => (person.interests || []).some(tag => String(tag).toLowerCase() === String(effective).toLowerCase())), [members, effective]);
 if (isLoading) return <main className="p-6" aria-busy="true"><h1 className="text-3xl font-semibold">In Orbit</h1><p className="mt-3 text-muted-foreground">Finding your mood constellations…</p></main>;
 if (isError) return <main className="p-6"><h1 className="text-3xl font-semibold">In Orbit</h1><p role="alert" className="mt-3">People could not be loaded.</p><button type="button" className="mt-4 min-h-11 rounded-xl border px-4" onClick={()=>refetch()}>Try again</button></main>;
 if (!bubbles.length) return <main className="p-6"><h1 className="text-3xl font-semibold">In Orbit</h1><p className="mt-3 text-muted-foreground">No shared-interest constellation is available yet. Your privacy and discovery settings are still respected.</p></main>;
 return <main className="mx-auto max-w-2xl space-y-6 px-5 py-7 pb-28"><header className="text-center"><div className="flex items-center justify-center gap-2 text-primary"><Orbit className="h-5 w-5"/><span className="text-sm font-medium">Mood Constellations</span></div><h1 className="mt-1 text-4xl font-semibold tracking-tight">In Orbit</h1><p className="mt-2 text-muted-foreground">Shared interests create brighter connections.</p></header><section aria-label="Mood constellation" className="relative isolate h-[25rem] overflow-hidden rounded-[2rem] border border-primary/30 bg-primary/20 shadow-[0_18px_52px_hsl(var(--primary)/.18)] sm:h-[29rem]"><img src={constellationMood} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-40 contrast-75 saturate-75"/><span aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-primary/55 via-primary/20 to-background/30"/><span aria-hidden="true" className="absolute left-[12%] top-[14%] h-1.5 w-1.5 rounded-full bg-primary/60"/><span aria-hidden="true" className="absolute right-[14%] top-[20%] h-2 w-2 rounded-full bg-primary/50"/><span aria-hidden="true" className="absolute bottom-[16%] left-[16%] h-1.5 w-1.5 rounded-full bg-primary/50"/><span aria-hidden="true" className="absolute bottom-[13%] right-[13%] h-1 w-1 rounded-full bg-primary/60"/><svg aria-hidden="true" className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">{CONSTELLATION_LINKS.filter(([from,to])=>bubbles[from]&&bubbles[to]).map(([from,to])=>{const [x1,y1]=NODE_POSITIONS[from].map(value=>Number.parseFloat(value));const [x2,y2]=NODE_POSITIONS[to].map(value=>Number.parseFloat(value));return <line key={`${from}-${to}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeOpacity=".28" strokeWidth=".35" className="text-primary"/>;})}</svg>{bubbles.map((bubble,index)=>{const [left,top]=NODE_POSITIONS[index];const active=effective===bubble;return <button key={bubble} type="button" onClick={()=>setSelected(bubble)} aria-pressed={active} className={`absolute isolate flex min-h-11 min-w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-hidden rounded-full [clip-path:circle(50%)] px-3 text-center text-xs font-semibold leading-tight text-white transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 motion-safe:hover:scale-105 ${active?'z-10 h-28 w-28 shadow-[0_0_0_5px_hsl(var(--background)),0_0_32px_hsl(var(--primary)/.7)] sm:h-32 sm:w-32':'h-24 w-24 border border-white/40 shadow-[0_10px_28px_hsl(var(--primary)/.42)] sm:h-28 sm:w-28'}`} style={{left,top}}><InterestNodeArtwork interest={bubble}/><span aria-hidden="true" className={`pointer-events-none absolute inset-0 rounded-full ${INTEREST_NODE_OVERLAY_CLASS}`}/><span className="relative z-10 drop-shadow">{bubble}</span></button>;})}</section>{people.length ? <PeopleGallery people={people} interest={effective} /> : <section className="rounded-[1.75rem] border border-dashed border-primary/20 bg-card p-6 text-center"><h2 className="text-lg font-semibold">People in {effective}</h2><p className="mt-2 text-sm text-muted-foreground">There are no eligible people in this constellation right now.</p></section>}</main>;
}
