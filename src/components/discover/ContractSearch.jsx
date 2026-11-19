import UnifiedSearchFilters from '@/components/search/UnifiedSearchFilters';
import {legacySearchFilters} from '@/lib/legacy-search-filters';
import {useDiscoveryState,clearDiscoveryState} from '@/lib/use-discovery-state';
import {siRoute} from '@/lib/si-routing';
import PlanningAnswer from '@/components/search/PlanningAnswer';
import {discoveryIntent} from '@/lib/discovery-intent';
import {useAuth} from '@/lib/AuthContext';
import PlacesSearch from '@/components/search/PlacesSearch';
import SmartSearchChips from '@/components/search/SmartSearchChips';
import { interpretSmartSearch, activeSmartFilters, smartSearchIssues } from '@/lib/smart-search';
import SmartSearchResults, {SmartSearchSkeleton, SmartSearchEmpty, SearchCreateActions, searchHighlightTerms} from '@/components/search/SmartSearchResults';
import {Search, SlidersHorizontal, X} from 'lucide-react';
import {discoveryErrorMessage} from '@/lib/discovery-error-message';
import PremiumMoment from '@/components/membership/PremiumMoment';
import { advancedFilterIntent } from '@/lib/premium-prompt-policy';
import React, { useState, useRef, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { callSupabaseRpc } from '@/api/supabaseClient';
import { usePassportScope } from '@/lib/passport/runtime';
import { matchesScope, scopeChanged, verifyCurrentScope } from '@/lib/passport/response';
import { SEARCH_FIELDS, searchRequest } from '@/lib/discovery-search-contract';
import { useDiscoverySearch } from '@/lib/use-discovery-search';
import { nmoodCategories } from '@/lib/nmoods-data';
import ExplorerScopeNotice from '@/components/settings/passport/ExplorerScopeNotice';
import DatingProfileDeck from '@/components/discover-people/DatingProfileDeck';
import { fetchDiscoverableMembers } from '@/lib/member-discovery';
import { filterPeople } from '@/lib/people-search-filters';

const kinds = {all:'All',people:'People',circles:'Circles',experiences:'Experiences',posts:'Nmood Shares'};
export default function ContractSearch({ initialKind = 'all', initialQuery = '', embedded = false, homeCity = null, recommendations = false, deckOnly = false, lockedKind = false, actionBelowHeader = null }) {
 const [params,setParams] = useSearchParams();
 const {user}=useAuth();
 const navigate = useNavigate();
 const lastSubmission=useRef(null);
 const asking=useRef(false);const [askPending,setAskPending]=useState(false);
 const finishAsking=useCallback(()=>{asking.current=false;setAskPending(false);},[]);
 const nextSubmission=(query=text,mode='internal')=>{
  const key=JSON.stringify([user?.id,mode,query.trim().toLowerCase()]);const now=Date.now();
  if(lastSubmission.current?.key===key&&now-lastSubmission.current.at<60000)return false;
  lastSubmission.current={key,at:now};setSubmission(crypto.randomUUID());return true;
 };
 // Home is a separate browsing surface. It must never inherit filters that a
 // member used in the full People search, otherwise returning home can make
 // the deck look empty even though local profiles are available.
 const surface=deckOnly && /Android/i.test(navigator.userAgent) ? 'home:people' : `search:${embedded?'si':initialKind}`;
 const [saved,setSaved]=useDiscoveryState(user?.id,surface,{kind:({pals:'people',people:'people',circles:'circles',experiences:'experiences',nmoods:'posts','nmood-shares':'posts'})[params.get('tab')]||initialKind,filters:params.get('category')?{category:[params.get('category')]}:{},text:initialQuery,dismissed:[]});
 const kind=lockedKind ? initialKind : (Object.hasOwn(kinds,saved?.kind)?saved.kind:initialKind);
 const filters=saved?.filters&&typeof saved.filters==='object'&&!Array.isArray(saved.filters)?saved.filters:{};
 const text=typeof saved?.text==='string'?saved.text.slice(0,200):'';
 const dismissed=Array.isArray(saved?.dismissed)?saved.dismissed:[];
 const field=(key,value)=>setSaved(previous=>({...previous,[key]:typeof value==='function'?value(previous?.[key]):value}));
 const setKind=value=>field('kind',value);const setFilters=value=>field('filters',value);const setText=value=>field('text',value);const setDismissed=value=>field('dismissed',value);
 const [offset,setOffset]=useState(0);
 const [showFilters,setShowFilters]=useState(false);
 const [submitted,setSubmitted]=useState(()=>siRoute(text)==='planning'?'':text); const [submission,setSubmission]=useState(0);
 const [submittedMode,setSubmittedMode]=useState(()=>siRoute(text)==='planning'?'internal':siRoute(text));
 const draftPlanning=embedded&&siRoute(text)==='planning';
 const planning=embedded&&(draftPlanning||submittedMode==='planning');
 const searchText=embedded?submitted:text;
 const {pending} = useDiscoverySearch(searchText); const scope=usePassportScope();
 const route=siRoute(searchText);
 const intent=useMemo(()=>discoveryIntent(searchText),[searchText]);
 const interpreted=useMemo(()=>interpretSmartSearch(searchText),[searchText]);
 const activeChips=interpreted.chips.filter(c=>!dismissed.includes(c.id));
 const selectedKind=activeChips.find(c=>c.type==='kind')?.value||kind;
 const kindLabel=value=>value==='community'?'Community':kinds[value]||'Community';
 const smartFilters=activeSmartFilters(interpreted.chips,dismissed);
 const smart=true; // One versioned RPC for identical card projections, with or without text.
 const selectedKinds=selectedKind==='all'?['people','circles','experiences','posts']:selectedKind==='community'?['circles','experiences']:[selectedKind];
 const invalidManual=Object.keys(filters).some(key=>(filters[key]||[]).length&&!selectedKinds.every(k=>SEARCH_FIELDS[k].includes(key)));
 const issues=[...smartSearchIssues(interpreted,dismissed),...(invalidManual?['Clear manual filters before changing the result type.']:[])];
 const current=useRef(scope.data); current.current=scope.data;
 const args=issues.length?[]:selectedKinds.map(k=>searchRequest(k,{...filters,...smartFilters},interpreted.query,offset,smart));
 const result=useQuery({queryKey:['discovery','contract-search',scope.data?.actor,scope.data?.fingerprint,smart,recommendations,args],enabled:!planning&&!!scope.data?.country&&!scope.isError&&!pending&&!issues.length,retry:false,
  queryFn:async({signal})=>{
   const expected=scope.data;
   const responses=await Promise.all(args.map(async request=>{
    const envelope=await callSupabaseRpc(recommendations?(smart?'nmood_smart_recommendation_discovery':'nmood_recommendation_discovery'):(smart?'nmood_smart_search_discovery':'nmood_search_discovery'),{...request,p_expected_fingerprint:expected.fingerprint},{signal,expectedUserId:expected.actor}).catch(error=>{if(String(error?.message).includes('EXPLORER_SCOPE_CHANGED'))throw scopeChanged();throw error;});
    if(envelope?.contract!==(smart?'smart-search-1':'discovery-search-1')||!matchesScope(expected,envelope.scope)||!Array.isArray(envelope.rows))throw scopeChanged();
    // Old servers cannot attest that raw Share locations were removed. Fail closed.
    let rows=request.p_kind==='posts'&&envelope.location_projection!=='public-location-1'?envelope.rows.map(row=>{const safe={...row};delete safe.location;return safe;}):envelope.rows;
    const emptyUnfilteredAndroidHome=deckOnly&&/Android/i.test(navigator.userAgent)&&request.p_kind==='people'&&rows.length===0&&!request.p_query&&Object.keys(request.p_filters||{}).length===0;
    if(emptyUnfilteredAndroidHome) rows=await fetchDiscoverableMembers(request.p_limit,{signal,global:true});
    return {...envelope,rows,kind:request.p_kind};
   }));
   await verifyCurrentScope(expected,signal);
   if(!matchesScope(expected,current.current))throw scopeChanged();
   return {scope:expected,groups:responses.map(r=>({kind:r.kind,rows:r.rows.slice(0,20),hasMore:r.rows.length>20})),rows:responses.flatMap(r=>r.rows.slice(0,20).map(row=>({...row,kind:r.kind}))),hasMore:responses.some(r=>r.rows.length>20)};
  }});
 const rows=!pending&&!issues.length&&!result.isError&&matchesScope(result.data?.scope,scope.data)?result.data.rows:[];
 const homeRows=useMemo(()=>deckOnly?filterPeople(rows,filters):rows,[deckOnly,rows,filters]);
 const reset=()=>{clearDiscoveryState(user?.id);setKind(lockedKind ? initialKind : 'all');setParams({}, {replace:true});lastSubmission.current=null;setText('');setSubmitted('');setSubmittedMode('internal');setSubmission(0);setFilters({});setDismissed([]);setOffset(0);inputRef.current?.focus();};
 const inputRef=useRef(null);
 const tabRefs=useRef({});
 const selectKind=key=>{setKind(key);setFilters({});setDismissed(d=>[...d,...interpreted.chips.filter(c=>c.type==='kind').map(c=>c.id)]);setOffset(0);};
 const tabKey=(event,key)=>{
  const keys=Object.keys(kinds);const index=keys.indexOf(key);
  const next=event.key==='Home'?keys[0]:event.key==='End'?keys.at(-1):event.key==='ArrowRight'?keys[(index+1)%keys.length]:event.key==='ArrowLeft'?keys[(index+keys.length-1)%keys.length]:null;
  if(next){event.preventDefault();selectKind(next);tabRefs.current[next]?.focus();}
 };
 const clearText=()=>{lastSubmission.current=null;setText('');setSubmitted('');setSubmittedMode('internal');setSubmission(0);setDismissed([]);setOffset(0);inputRef.current?.focus();};
 const terms=searchHighlightTerms(interpreted.query,smartFilters);
 const suggestions=[...new Set(activeChips.filter(c=>c.type==='activity').flatMap(c=>c.filters.smart_activity||[]))].map(v=>v[0].toUpperCase()+v.slice(1));
 const applySuggestion=value=>{setText(value);setSubmitted(value);setSubmittedMode(siRoute(value));nextSubmission(value,siRoute(value));setDismissed([]);setOffset(0);inputRef.current?.focus();};
 const submit=(mode)=>{
  if(!text.trim())return;
  const chosen=mode==='planning'||siRoute(text)==='planning'?'planning':siRoute(text);
  if(chosen==='planning'&&asking.current)return;
  if(!nextSubmission(text,chosen))return;
  if(chosen==='planning'){asking.current=true;setAskPending(true);}
  setSubmitted(text);setSubmittedMode(chosen);setOffset(0);setDismissed([]);
  if(chosen!=='planning'&&text===submitted&&submittedMode!=='planning')void result.refetch();
 };
 if (deckOnly) {
  if (scope.isPending || pending || result.isFetching) return <div className="mx-auto h-[calc(100dvh-10rem)] min-h-[34rem] max-w-[29rem] animate-pulse rounded-[2rem] bg-muted" />;
  if (scope.isError || result.isError) return <section className="mx-auto max-w-[29rem] rounded-3xl border bg-card p-6 text-center"><h2 className="font-semibold">People are unavailable right now</h2><p className="mt-2 text-sm text-muted-foreground">Please try again in a moment.</p><button type="button" className="mt-4 min-h-11 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground" onClick={()=>void result.refetch()}>Try again</button></section>;
  if (!scope.data?.country) return <section className="mx-auto max-w-[29rem] rounded-3xl border bg-card p-6 text-center"><h2 className="font-semibold">Set your discovery area</h2><p className="mt-2 text-sm text-muted-foreground">Add your country in Settings to see people nearby.</p></section>;
  return <section className="mx-auto w-full max-w-[29rem] space-y-3" aria-label="Home discovery">
   <div className="flex items-center justify-between px-1 pt-1"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#3611db]">Discover</p><h1 className="mt-1 text-xl font-bold text-[#19095d]">People for you</h1></div><button type="button" onClick={()=>setShowFilters(true)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border bg-card px-3 text-sm font-semibold text-[#3611db]"><SlidersHorizontal className="h-4 w-4" />Filters</button></div>
   <UnifiedSearchFilters tab="pals" open={showFilters} onOpenChange={setShowFilters} filters={{...filters,looking_for:filters.looking_for_tags,gender:(filters.gender||[]).map(v=>({male:'men',female:'women'}[v]||v)),age_min:filters.age_min?.[0],age_max:filters.age_max?.[0]}} availableCategories={nmoodCategories.map(c=>c.id)} onApply={value=>{setFilters(legacySearchFilters('people',value));setOffset(0);setShowFilters(false);}} onReset={()=>{setFilters({});setOffset(0);setShowFilters(false);}}/>
   <DatingProfileDeck members={homeRows} homeMode hasExplicitGenderFilter={Array.isArray(filters.gender)&&filters.gender.length>0} onAdjustFilters={()=>setShowFilters(true)} onClearFilters={()=>{setFilters({});setOffset(0);}} onNeedMore={result.data?.hasMore ? () => setOffset(value => value + 20) : undefined} />
  </section>;
 }
 return <section className={`mx-auto max-w-6xl min-w-0 space-y-4 ${embedded ? 'px-4 pt-[max(1rem,env(safe-area-inset-top))]' : 'px-4 pb-24'}`} aria-label="Discovery search">
  <PremiumMoment moment="filters" intent={kind==='people' && advancedFilterIntent(filters)}/>
  <div className={embedded?'-mx-4 -mt-4 bg-gradient-to-br from-[#102b61] via-[#194fb5] to-[#1685ef] px-5 pb-7 pt-[max(1.5rem,env(safe-area-inset-top))] text-white':'space-y-4'}>
  <header className={embedded?'mb-6':'rounded-3xl bg-nmood-gradient px-5 py-7 text-white'}><div className="flex items-center justify-between gap-3"><p className="font-heading text-xl font-bold">Nmood</p>{embedded&&<p className="text-right text-xs text-white/85">{scope.data?.city||(!scope.data?.active?homeCity:null)||scope.data?.country||''}</p>}</div><h1 className="mt-6 text-3xl font-bold leading-tight">{embedded?'Nmood SI':lockedKind?kindLabel(initialKind):'Smart Search'}</h1><p className="mt-3 text-sm leading-relaxed text-white/85">{lockedKind ? initialKind==='community'?'Explore Circles and Experiences in one place.':initialKind==='experiences'?'Find plans, gatherings, and things to do together.':initialKind==='posts'?'See every Nmood Share from your discovery area.':'Find communities built around what you enjoy.':'Ask about date ideas, plans, packing lists, budgets, people, or places.'}</p></header>
  {actionBelowHeader}
  <div className="relative"><label className="sr-only" htmlFor="smart-search-query">Search {kindLabel(selectedKind)}</label><Search size={20} aria-hidden="true" className="pointer-events-none absolute left-4 top-4 text-muted-foreground"/>
   <input ref={inputRef} id="smart-search-query" aria-label={embedded?'Nmood SI':`Search ${kindLabel(selectedKind)}`} aria-describedby="smart-search-hint" className="block min-h-14 w-full min-w-0 rounded-2xl border border-border bg-card text-foreground py-4 pl-12 pr-14 text-base shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-blue-500" placeholder={lockedKind ? initialKind==='community'?'Circles, plans, coffee…':initialKind==='experiences'?'Food, outdoors, this weekend…':initialKind==='posts'?'Coffee, a plan, something new…':'Sports, coffee, a new Circle…':'Camping, coffee, a new Circle…'} maxLength={200} value={text} autoComplete="off" spellCheck={false} onKeyDown={e=>{if(embedded&&e.key==='Enter'){e.preventDefault();submit(siRoute(text));}if(e.key==='Escape'){e.preventDefault();clearText();}}} onChange={e=>{setText(e.target.value);if(!embedded){setDismissed([]);setOffset(0);}}}/>
   {!!text&&<button type="button" aria-label="Clear search" onClick={clearText} className="absolute right-1.5 top-1.5 grid h-11 w-11 place-items-center rounded-xl text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"><X size={18} aria-hidden="true"/></button>}
  </div>
  {lockedKind && initialKind==='community' && <section aria-label="Create community content" className="grid gap-3 rounded-3xl border border-primary/15 bg-primary/[0.04] p-5 sm:grid-cols-2"><div><h2 className="text-xl font-bold">Start a Circle</h2><p className="mt-2 text-sm text-muted-foreground">Bring people together around a shared interest.</p><button type="button" onClick={() => navigate('/host/create-circle')} className="mt-4 min-h-11 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">Create a Circle</button></div><div className="border-t border-primary/10 pt-4 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0"><h2 className="text-xl font-bold">Host an Experience</h2><p className="mt-2 text-sm text-muted-foreground">Turn an idea into something people can join.</p><button type="button" onClick={() => navigate('/host/create')} className="mt-4 min-h-11 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">Create an Experience</button></div></section>}
  {lockedKind && initialKind==='experiences' && <div className="flex flex-wrap gap-2"><button type="button" onClick={()=>applySuggestion('tonight')} className="min-h-11 rounded-full border border-primary/20 bg-primary/5 px-4 text-sm font-semibold text-primary">Tonight</button><button type="button" onClick={()=>applySuggestion('this weekend')} className="min-h-11 rounded-full border border-primary/20 bg-primary/5 px-4 text-sm font-semibold text-primary">This weekend</button><button type="button" onClick={()=>applySuggestion('new')} className="min-h-11 rounded-full border border-primary/20 bg-primary/5 px-4 text-sm font-semibold text-primary">New plans</button></div>}
  {embedded&&<div className="mt-4 grid grid-cols-2 gap-3" aria-label="Choose how to use Nmood SI">
   <button type="button" aria-describedby="si-ask-description" disabled={!text.trim()||askPending} className="min-h-14 rounded-2xl bg-white px-4 text-base font-semibold text-blue-800 shadow-sm focus-visible:ring-2 focus-visible:ring-white disabled:opacity-60" onClick={()=>submit('planning')}>Ask Nmood</button>
   <button type="button" aria-describedby="si-search-description" disabled={!text.trim()||draftPlanning} className="min-h-14 rounded-2xl border border-white/60 px-4 text-base font-semibold text-white focus-visible:ring-2 focus-visible:ring-white disabled:opacity-60" onClick={()=>submit('internal')}>Search Nmood</button>
  </div>}
  {embedded&&<div className="mt-2 grid grid-cols-2 gap-3 text-sm leading-relaxed text-white/90"><p id="si-ask-description">AI help with plans, packing and budgets</p><p id="si-search-description">Find people, Circles, Experiences, Shares and places</p></div>}
  {embedded&&<p className="mt-3 text-xs leading-relaxed text-white/90">{draftPlanning?'Use Ask Nmood for this planning question. ':'Ask Nmood for planning help, or search people, Circles, Experiences and Shares. '}Ask Nmood uses AI and your allowance. Keep private details out.</p>}
  {embedded&&!text&&<div className="mt-3 flex flex-wrap gap-2">{[['Tonight','tonight'],['Outdoors','outdoor'],['Food','food'],['New people','people']].map(([label,query])=><button key={label} type="button" onClick={()=>applySuggestion(query)} className="min-h-11 rounded-full bg-white/15 px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">{label}</button>)}</div>}
  </div>
  {embedded&&!planning&&intent.activity&&<div className="space-y-2"><div aria-label="Planning preferences" className="flex flex-wrap gap-2">{intent.labels.filter(label=>!activeChips.some(chip=>chip.label.toLowerCase()===label.toLowerCase())).map((label,index)=><span key={index} className="rounded-full bg-blue-50 px-3 py-2 text-xs text-blue-900 dark:bg-blue-950 dark:text-blue-100">{label}</span>)}</div>{intent.budget&&<p className="text-xs leading-relaxed text-muted-foreground">Price levels don’t confirm an exact AED spend.</p>}</div>}
  {!embedded&&<ExplorerScopeNotice/>}
  {!planning&&<SmartSearchChips chips={interpreted.chips} dismissed={dismissed} onRemove={id=>{setDismissed(d=>[...d,id]);setOffset(0);inputRef.current?.focus();}}/>}
  <p id="smart-search-hint" className={embedded?'sr-only':'text-xs leading-relaxed text-muted-foreground'}>Your words, understood on your device. Remove a chip to adjust your search. Any selected value within a field can match. Different fields must all match.</p>
  {!embedded&&!!activeChips.length&&<details className="text-xs text-muted-foreground"><summary className="min-h-11 cursor-pointer py-3">How these filters work</summary><div className="space-y-2 pb-3">  {activeChips.some(c=>c.type==='place')&&<p className="text-xs text-muted-foreground">Places match public venue and area names, not distance or private locations.</p>}
  {activeChips.some(c=>c.type==='time')&&<p className="text-xs text-muted-foreground">Dates use your device calendar and listed event local time. Tonight: 18:00–midnight. Weekend: Saturday–Sunday. Listings without a date and time cannot match.</p>}
  {activeChips.some(c=>c.type==='budget')&&<p className="text-xs text-muted-foreground">Uses listed budgets only. Missing prices are excluded; estimated ranges must fit entirely within your budget.</p>}
  {activeChips.some(c=>c.type==='age'||c.type==='zodiac'||c.type==='language')&&<p className="text-xs text-muted-foreground">Profile filters match only fields the member shares and you are allowed to view.</p>}
</div></details>}
  {!lockedKind && <div role="tablist" aria-label="Discover categories" className="flex flex-wrap gap-1 rounded-2xl bg-muted/50 p-1.5">{Object.entries(kinds).map(([key,label])=><button type="button" key={key} ref={el=>{tabRefs.current[key]=el;}} id={`search-tab-${key}`} role="tab" aria-controls="search-results-panel" aria-selected={selectedKind===key} tabIndex={selectedKind===key?0:-1} onKeyDown={e=>tabKey(e,key)} className={`nmood-discover-category min-h-11 flex-1 rounded-xl px-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${selectedKind===key?'bg-card text-primary shadow-sm':'text-muted-foreground hover:text-foreground'}`} onClick={()=>selectKind(key)}>{label}</button>)}</div>}
  {!planning&&<div className="flex flex-wrap items-center gap-3">
   {selectedKind!=='all'&&<button type="button" className="min-h-11 rounded-xl border px-4" onClick={()=>setShowFilters(true)}>Filters</button>}
   <button type="button" className="min-h-11 rounded-xl border px-4" onClick={reset}>Clear all</button>
  </div>}
  <UnifiedSearchFilters tab={selectedKind==='people'?'pals':selectedKind==='posts'?'nmoods':selectedKind==='community'?'circles':selectedKind} open={showFilters} onOpenChange={setShowFilters} filters={{...filters,looking_for:filters.looking_for_tags,gender:(filters.gender||[]).map(v=>({male:'men',female:'women'}[v]||v)),age_min:filters.age_min?.[0],age_max:filters.age_max?.[0]}} availableCategories={nmoodCategories.map(c=>c.id)} onApply={value=>{setFilters(legacySearchFilters(selectedKind==='community'?'circles':selectedKind,value));setOffset(0);}} onReset={()=>{setShowFilters(false);reset();}}/>

  {embedded&&draftPlanning&&submittedMode!=='planning'&&<section aria-label="Planning question" className="space-y-2 rounded-3xl border border-blue-100 bg-card p-5"><h2 className="text-xl font-semibold">Let’s make a plan</h2><p className="text-sm leading-relaxed text-muted-foreground">Choose Ask Nmood above for an AI answer to your question. This uses your Ask Nmood allowance.</p></section>}
  {embedded&&<PlanningAnswer question={submitted} identity={user?.id} submission={submission} enabled={submittedMode==='planning'} onSettled={finishAsking}/>}
  {!planning&&<div id="search-results-panel" role={embedded?"region":"tabpanel"} aria-label={embedded?"Nmood search results":undefined} aria-labelledby={embedded?undefined:`search-tab-${selectedKind}`} tabIndex={0} className="min-w-0 space-y-6 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500" aria-busy={pending||result.isFetching}>
   {embedded&&<div className="flex items-end justify-between gap-3 pt-3"><div><p className="text-xs uppercase tracking-wide text-muted-foreground">{pending||result.isFetching?'Finding your matches':result.isError||scope.isError?'Your search':`${rows.length}${result.data?.hasMore?'+':''} matching results`}</p><h2 className="mt-2 text-2xl font-bold">On Nmood</h2></div>{selectedKind!=='all'&&<button type="button" onClick={()=>selectKind('all')} className="min-h-11 text-sm font-medium text-blue-700">All results</button>}</div>}
   <span className="sr-only" role="status" aria-live="polite">{!pending&&!result.isFetching&&!issues.length&&!result.isError?`${rows.length}${result.data?.hasMore?' or more':''} matching results loaded`:''}</span>
   {issues.length?<p role="alert" className="rounded-2xl border p-4 text-sm">{issues.join(' ')}</p>:scope.isError?<div role="alert" className="space-y-3 rounded-2xl border bg-card p-5"><h2 className="font-semibold">Search is unavailable right now</h2><p className="text-sm text-muted-foreground">Your search is kept here. We could not confirm your discovery area.</p><button type="button" className="min-h-11 text-primary underline" onClick={()=>void scope.refetch()}>Retry search</button></div>:scope.isPending?<SmartSearchSkeleton all={selectedKind==='all'||selectedKind==='community'}/>:!scope.data?.country?<p role="status">Set your home country to search. {embedded?'Choose a country in Settings.':'Discovery never searches worldwide.'}</p>:result.isError?<div role="alert" className="space-y-3 rounded-2xl border bg-card p-5"><h2 className="font-semibold">Search is unavailable right now</h2><p className="text-sm leading-relaxed text-muted-foreground">{embedded?'Your search is kept here. Try again in a moment.':discoveryErrorMessage(result.error)}</p><button type="button" className="min-h-11 text-primary underline" onClick={()=>void result.refetch()}>Retry search</button></div>:pending||result.isFetching?<SmartSearchSkeleton all={selectedKind==='all'||selectedKind==='community'}/>:!rows.length?<SmartSearchEmpty kind={selectedKind} onReset={reset} suggestions={suggestions} onSuggestion={applySuggestion} showActions={!embedded&&!lockedKind}/>:deckOnly&&selectedKind==='people'?<DatingProfileDeck members={rows}/>:<SmartSearchResults groups={result.data.groups} compact={embedded} all={selectedKind==='all'||selectedKind==='community'} terms={terms} onViewAll={key=>{selectKind(key);if(embedded)inputRef.current?.focus();else tabRefs.current[key]?.focus();}}/>}
   {selectedKind!=='all'&&<nav aria-label="Search pages" className="flex justify-between gap-3"><button type="button" className="min-h-11 rounded-xl border px-4 text-sm focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-40" disabled={!offset||result.isFetching||pending} onClick={()=>setOffset(n=>Math.max(0,n-20))}>Previous</button><button type="button" className="min-h-11 rounded-xl border px-4 text-sm focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-40" disabled={!result.data?.hasMore||result.isFetching||!!issues.length||pending} onClick={()=>setOffset(n=>n+20)}>Next</button></nav>}
  </div>}
  {embedded&&!planning&&<PlacesSearch intent={intent} identity={user?.id} submission={submission} rows={rows} enabled={route==='venue'&&import.meta.env.VITE_NMOOD_PLACES_ENABLED==='true'}/> }
  {lockedKind && initialKind==='circles' && <section className="rounded-3xl border border-primary/15 bg-primary/[0.04] p-5"><h2 className="text-xl font-bold">Start a Circle</h2><p className="mt-2 text-sm text-muted-foreground">Bring people together around a shared interest.</p><button type="button" onClick={() => navigate('/host/create-circle')} className="mt-4 min-h-11 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">Create a Circle</button></section>}
  {lockedKind && initialKind==='experiences' && <section className="rounded-3xl border border-primary/15 bg-primary/[0.04] p-5"><h2 className="text-xl font-bold">Host an Experience</h2><p className="mt-2 text-sm text-muted-foreground">Turn an idea into something people can join.</p><button type="button" onClick={() => navigate('/host/create')} className="mt-4 min-h-11 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">Create an Experience</button></section>}
  {!lockedKind && (embedded||!!rows.length)&&<div className="space-y-4 pt-4"><h2 className="text-2xl font-bold">Create your own</h2><SearchCreateActions destination={embedded}/></div>}


 </section>;
}
