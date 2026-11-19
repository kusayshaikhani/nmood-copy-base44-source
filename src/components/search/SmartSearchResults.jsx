import CompactProfile from '@/components/shared/CompactProfile';
import UnifiedContentCard from '@/components/shared/UnifiedContentCard';
import React from 'react';
import {Link} from 'react-router-dom';
import {CalendarDays, Search, Plus} from 'lucide-react';
import {SMART_ACTIVITIES} from '@/lib/smart-search';

export const RESULT_LABELS = {people:'People',circles:'Circles',experiences:'Experiences',posts:'Nmood Shares'};
const focus='focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2';
const string=value=>typeof value==='string'?value.trim():'';
export function searchHighlightTerms(query, filters={}) {
 return [...new Set([...string(query).split(/\s+/),...Object.entries(filters).flatMap(([key,values])=>key==='smart_activity'?values.flatMap(v=>SMART_ACTIVITIES[v]||[]):['smart_zodiac','smart_language','smart_place'].includes(key)?values:[])])].filter(v=>v.length>=2).slice(0,30);
}
export function MatchText({text,terms=[]}) {
 const value=string(text);const words=terms.filter(t=>typeof t==='string'&&t.length>=2).map(t=>t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).sort((a,b)=>b.length-a.length);
 if(!words.length)return value;
 const pattern=new RegExp(`(${words.join('|')})`,'gi');
 return value.split(pattern).map((part,index)=>index%2?<mark key={index} className="rounded-sm bg-primary/10 text-inherit">{part}</mark>:part);
}
export function listedPrice(row) {
 const budget=string(row.budget);if(!budget)return null;
 if(/^free$/i.test(budget))return 'Free';
 if(/^(?:0(?:\.0{1,2})?|AED\s+0(?:\.0{1,2})?)$/i.test(budget))return 'Free';
 if(/^AED\s+\d/i.test(budget))return budget;
 if(/^\d+(?:\.\d{1,2})?(?:\s*[–-]\s*\d+(?:\.\d{1,2})?|\+)?$/.test(budget)) {
  const currency=string(row.currency)||(row.country_code==='AE'?'AED':'');
  return currency?`${currency} ${budget}`:budget;
 }
 return budget; // Host-entered text only; no default Free or manufactured currency.
}
export function SmartSearchCard({kind,row,terms=[]}) {
 const renderText=text=><MatchText text={text} terms={terms}/>;
 if(kind==='people')return <article data-search-card="people" className="discovery-card compact-discovery-card unified-card"><Link to={`/pal/${encodeURIComponent(row.id)}`} aria-label={`View profile: ${row.display_name||row.name||'Member'}`} className="compact-profile-link"><CompactProfile person={row} renderText={renderText}/></Link></article>;
 return <UnifiedContentCard kind={kind} row={row} renderText={renderText}/>;
}
export function SmartSearchSkeleton({all=false}) {
 return <div role="status" aria-label="Searching" className="space-y-6"><span className="sr-only">Searching…</span>{Array.from({length:all?4:2},(_,i)=><div aria-hidden="true" key={i} className="space-y-3 motion-safe:animate-pulse">{all&&<div className="h-5 w-28 rounded-lg bg-muted"/>}<div className="flex gap-4 rounded-3xl border p-5"><div className="h-20 w-20 shrink-0 rounded-2xl bg-muted"/><div className="flex-1 space-y-3 pt-2"><div className="h-4 w-2/3 rounded bg-muted"/><div className="h-3 w-full rounded bg-muted"/><div className="h-3 w-1/2 rounded bg-muted"/></div></div></div>)}</div>;
}
export function SearchCreateActions({destination=false}) {return <nav aria-label="Create something new" className={destination?"grid grid-cols-2 gap-3":"flex flex-wrap gap-2"}><Link to="/host/create-circle" className={`${destination?"flex min-h-24 flex-col items-start justify-center gap-3 rounded-3xl bg-blue-50 p-4 text-sm font-semibold text-blue-800 dark:bg-blue-950 dark:text-blue-100":"inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm text-primary"} ${focus}`}><Plus size={16} aria-hidden="true"/>Create a Circle</Link><Link to="/host/create" className={`${destination?"flex min-h-24 flex-col items-start justify-center gap-3 rounded-3xl bg-blue-50 p-4 text-sm font-semibold text-blue-800 dark:bg-blue-950 dark:text-blue-100":"inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm text-primary"} ${focus}`}><CalendarDays size={16} aria-hidden="true"/>Create an Experience</Link></nav>;}
export function SmartSearchEmpty({onReset,suggestions=[],onSuggestion,showActions=true}) {
 return <div className="space-y-6 rounded-3xl border bg-card p-6 sm:p-8"><div className="space-y-2"><Search aria-hidden="true" size={24} className="text-primary"/><h2 className="text-xl font-semibold">No matching Nmood content yet</h2><p className="text-sm leading-relaxed text-muted-foreground">Try fewer filters or a different phrase within your selected area.</p></div>
  {!!suggestions.length&&<div><p className="mb-2 text-xs font-semibold text-muted-foreground">Related searches to try</p><div className="flex flex-wrap gap-2">{suggestions.map(s=><button key={s} type="button" onClick={()=>onSuggestion(s)} className={`min-h-11 max-w-full rounded-full bg-primary/5 px-4 text-sm text-primary [overflow-wrap:anywhere] ${focus}`}>{s}</button>)}</div></div>}
  <button type="button" onClick={onReset} className={`min-h-11 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground ${focus}`}>Reset search</button>{showActions&&<div className="space-y-3 border-t pt-5"><p className="text-sm text-muted-foreground">Bring people together around your idea.</p><SearchCreateActions/></div>}
 </div>;
}
export default function SmartSearchResults({groups,all,terms,onViewAll,compact=false}) {
 return <div className={compact?"space-y-5":"space-y-8"}>{groups.filter(group=>group.rows.length>0).map(group=><section key={group.kind} aria-labelledby={`results-heading-${group.kind}`} className="min-w-0 space-y-3">
  {all&&<div className="flex items-center justify-between gap-3"><h2 id={`results-heading-${group.kind}`} className={compact?"text-sm font-semibold text-muted-foreground":"text-lg font-semibold"}>{RESULT_LABELS[group.kind]} <span className="ml-1 text-sm font-normal text-muted-foreground" aria-label={`${group.rows.length}${group.hasMore?' or more':''} matching results`}>{group.rows.length}{group.hasMore?'+':''}</span></h2>{group.rows.length>0&&<button type="button" onClick={()=>onViewAll(group.kind)} className={`min-h-11 shrink-0 rounded-xl px-2 text-sm font-semibold text-primary ${focus}`} aria-label={`View all ${RESULT_LABELS[group.kind]}`}>View all</button>}</div>}
  {!all&&<h2 id={`results-heading-${group.kind}`} className="sr-only">{RESULT_LABELS[group.kind]} results</h2>}
  {group.rows.length?<div className="discovery-grid">{group.rows.slice(0,all?4:20).map(row=><SmartSearchCard key={row.id} kind={group.kind} row={row} terms={terms} compact={compact}/>)}</div>:<p className="rounded-2xl border border-dashed px-4 py-4 text-sm text-muted-foreground">No matching {RESULT_LABELS[group.kind].toLowerCase()} in this search.</p>}
 </section>)}</div>;
}
