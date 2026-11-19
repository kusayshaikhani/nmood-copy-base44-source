import {SmartSearchCard} from '@/components/search/SmartSearchResults';
import React, { useEffect, useMemo, useState } from 'react';
import { sharedResonance } from '@/lib/resonance-discovery';

const PAGE_SIZE = 12;

function createdAt(item) {
 const value = item?.created_at || item?.created_date;
 const stamp = typeof value === 'string' ? Date.parse(value) : NaN;
 return Number.isFinite(stamp) ? stamp : null;
}

// Timestamps are server-projected. This only makes their ordering deterministic
// in the mixed All feed; it never invents a client recency signal.
export function newestFirst(items) {
 return [...items].map((item, index) => ({ item, index, stamp: createdAt(item) }))
  .sort((a, b) => (b.stamp ?? -Infinity) - (a.stamp ?? -Infinity) || a.index - b.index)
  .map(({ item }) => item);
}

export function bestFitPeople(items, viewer) {
 return [...items].map((person, index) => {
  const shared = sharedResonance(person, viewer).sharedInterests.length;
  // Only values already returned by the authorized People projection take part.
  const age = Number.isFinite(person?.age) && Number.isFinite(viewer?.age) ? Math.max(0, 12 - Math.abs(person.age - viewer.age)) : 0;
  const habits = person?.share_smoking !== false && viewer?.share_smoking !== false && person?.smoking && viewer?.smoking && person.smoking === viewer.smoking ? 1 : 0;
  const drinking = person?.share_drinking !== false && viewer?.share_drinking !== false && person?.drinking && viewer?.drinking && person.drinking === viewer.drinking ? 1 : 0;
  const family = person?.share_family_plan !== false && viewer?.share_family_plan !== false && person?.family_plan && viewer?.family_plan && person.family_plan === viewer.family_plan ? 1 : 0;
  const lookingFor = Array.isArray(person?.looking_for_tags) && Array.isArray(viewer?.looking_for_tags) ? person.looking_for_tags.filter(tag => viewer.looking_for_tags.includes(tag)).length : 0;
  return { person, index, score: shared * 4 + age + habits + drinking + family + lookingFor };
 }).sort((a, b) => b.score - a.score || a.index - b.index).map(({ person }) => person);
}

export default function DiscoveryGallery({ items, viewer, peopleOnly = false }) {
 const [visible, setVisible] = useState(PAGE_SIZE);
 const [sort, setSort] = useState('newest');
 const orderKey = items.map(item => `${item.type}:${item.id}`).join('|');
 useEffect(() => { setVisible(PAGE_SIZE); }, [orderKey, sort]);
 const ordered = useMemo(() => peopleOnly && sort === 'best_fit' ? bestFitPeople(items, viewer) : peopleOnly ? newestFirst(items) : items, [items, viewer, peopleOnly, sort]);
 const page = ordered.slice(0, visible);
 const more = visible < ordered.length;
 const loadMore = () => setVisible(count => Math.min(count + PAGE_SIZE, ordered.length));
 return <section aria-label="Discovery gallery" className="space-y-4">
   <div className="flex items-center justify-between gap-3"><p className="text-sm text-muted-foreground">{items.length} results</p>{peopleOnly && <div className="flex rounded-xl border border-border p-0.5 text-xs"><button type="button" onClick={() => setSort('newest')} aria-pressed={sort === 'newest'} className={`min-h-11 rounded-lg px-3 ${sort === 'newest' ? 'bg-primary text-primary-foreground' : ''}`}>Newest</button><button type="button" onClick={() => setSort('best_fit')} aria-pressed={sort === 'best_fit'} className={`min-h-11 rounded-lg px-3 ${sort === 'best_fit' ? 'bg-primary text-primary-foreground' : ''}`}>Best fit</button></div>}</div>
   <div className="max-h-[calc(100vh-19rem)] overflow-y-auto overscroll-contain pr-1" onScroll={event => { const node = event.currentTarget; if (more && node.scrollTop + node.clientHeight >= node.scrollHeight - 24) loadMore(); }}>
    <div className="space-y-6">{[['person','people','People'],['circle','circles','Circles'],['experience','experiences','Experiences'],['post','posts','Nmood Shares']].map(([type,kind,label])=>{
      const rows=page.filter(item=>item.type===type);
      if(!rows.length)return null;
      return <section key={kind} aria-label={label} className="space-y-3"><h2 className="text-lg font-semibold">{label}</h2><div className="discovery-grid">{rows.map(item=><SmartSearchCard key={`${type}-${item.id}`} kind={kind} row={{...item,display_name:item.display_name||item.name,photo_url:item.photo_url||item.avatar,cover_image:item.cover_image||item.image}}/>)}</div></section>;
    })}</div>
    {more && <button type="button" onClick={loadMore} className="mx-auto mt-4 flex min-h-11 items-center rounded-xl border border-primary/25 px-4 text-sm font-medium text-primary">Load more</button>}
   </div>
  </section>;
}
