import {MAIN_PASSPORT} from '@/lib/passport/enabled';
import React, { useEffect, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { categoryLabel } from '@/lib/i18n/label-resolvers';
import { LOOKING_FOR_TAGS, ZODIAC_SIGNS, lookingForTagLabel, zodiacLabel } from '@/lib/looking-for-tags';
import { interests, languages, maritalStatusOptions, familyPlanFilterOptions } from '@/lib/onboarding-data';
import { smokingOptions, drinkingOptions } from '@/lib/profile-habits';
import FilterSelectField from './FilterSelectField';

const options = values => values.map(value => ({value,label:value}));
const year = (value, fallback) => Math.max(18,Math.min(99,Math.round(Number(value) || fallback)));
export default function UnifiedSearchFilters({ tab, open, onOpenChange, filters, onApply, onReset, memberLocation, availableCategories }) {
 const { t } = useLocalization();
 const [draft,setDraft] = useState(filters || {});
 const [ageMin,setAgeMin] = useState(String(filters?.age_min ?? 18));
 const [ageMax,setAgeMax] = useState(String(filters?.age_max ?? 99));
 // Editing is local to this sheet; no result updates until Apply filters.
 useEffect(() => { if(open) { setDraft(filters || {});setAgeMin(String(filters?.age_min ?? 18));setAgeMax(String(filters?.age_max ?? 99)); } },[open,JSON.stringify(filters||{})]);
 const clear = () => {setDraft({});setAgeMin('18');setAgeMax('99');onReset?.();};
 const apply = () => {
  const next={...draft};
  if(tab==='pals') {
   const min=year(ageMin,18),max=Math.max(min,year(ageMax,99));
   delete next.age_min;delete next.age_max;delete next.pals_distance;
   if(min!==18 || max!==99) {next.age_min=min;next.age_max=max;}
  }
  onApply(next);onOpenChange(false);
 };
 const field = (key,label,opts,extra={}) => <FilterSelectField key={key} label={label} options={opts} selected={draft[key] || []} onChange={values => setDraft(prev=>({...prev,[key]:values}))} {...extra} />;
 const distanceOptions=[1,5,10,50].map(n=>({value:String(n),label:`${n} km`}));
 return <Sheet open={open} onOpenChange={onOpenChange}>
  <SheetContent side="bottom" className="mx-auto max-h-[90dvh] max-w-4xl rounded-t-2xl bg-white text-slate-900 flex flex-col pb-[max(1rem,env(safe-area-inset-bottom))]">
   <SheetHeader className="shrink-0 pr-8 text-left"><SheetTitle className="flex items-center gap-2 text-slate-900"><SlidersHorizontal size={18} className="text-violet-700" />Filters</SheetTitle><SheetDescription className="text-slate-600">Choose your preferences, then apply them to discovery.</SheetDescription></SheetHeader>
   <div data-testid="discovery-filter-grid" className="min-h-0 flex-1 overflow-y-auto overscroll-contain grid grid-cols-1 md:grid-cols-2 items-start gap-4 py-4 px-1">
    {tab==='pals' && <>
     {field('gender','Gender',[{value:'men',label:'Men'},{value:'women',label:'Women'}],{emptyLabel:'Everyone',clearLabel:'Everyone'})}
     {field('dating_looking_for_gender','Here for',[{value:'male',label:'Men'},{value:'female',label:'Women'},{value:'community_only',label:'Community'}],{emptyLabel:'Everyone',clearLabel:'Everyone'})}
     <fieldset className="min-w-0 space-y-1.5"><legend className="text-sm font-semibold text-slate-800">Age</legend><div className="flex min-h-14 items-center gap-2 rounded-2xl border border-violet-200 bg-white p-2 shadow-sm">
      <input type="number" inputMode="numeric" min="18" max="99" step="1" value={ageMin} onChange={e=>setAgeMin(e.target.value===''?'':String(Math.round(Number(e.target.value))))} onBlur={()=>setAgeMin(String(year(ageMin,18)))} aria-label="Minimum age" className="min-h-11 min-w-0 w-full rounded-xl border border-violet-100 px-3 text-sm focus:outline-violet-600" />
      <span aria-hidden="true">–</span><input type="number" inputMode="numeric" min="18" max="99" step="1" value={ageMax} onChange={e=>setAgeMax(e.target.value===''?'':String(Math.round(Number(e.target.value))))} onBlur={()=>setAgeMax(String(year(ageMax,99)))} aria-label="Maximum age" className="min-h-11 min-w-0 w-full rounded-xl border border-violet-100 px-3 text-sm focus:outline-violet-600" />
     </div><p className="text-xs leading-5 text-slate-600">{MAIN_PASSPORT?'Whole years. Members who do not share their age cannot match an age filter.':'Whole years. Members who do not share their age remain included.'}</p></fieldset>
     {field('marital_status','Marital status',maritalStatusOptions,{help:'Matches only profiles that chose to share their marital status.'})}
     {field('family_plan','Children and family plans',familyPlanFilterOptions,{help:'Matches only profiles that chose to share their family plans.'})}
     <div>{field('smoking','Smoking',smokingOptions,{help:'Matches only smoking details the profile authorizes you to view.'})}</div>
     <div>{field('drinking','Drinking',drinkingOptions,{help:'Matches only drinking details the profile authorizes you to view.'})}</div>
     {field('looking_for','Looking for',LOOKING_FOR_TAGS.map(value=>({value,label:lookingForTagLabel(t,value)})),{searchable:true})}
     {field('languages','Languages',options(languages),{searchable:true})}
     {field('zodiac','Zodiac',ZODIAC_SIGNS.map(value=>({value,label:zodiacLabel(t,value)})))}
     {field('activity','Last seen / activity',[{value:'online',label:'Online now'},{value:'day',label:'Active in the last 24 hours'},{value:'week',label:'Active in the last 7 days'}],{help:'Matches only activity the member permits you to see.'})}
     {field('distance','Distance',distanceOptions,{help:'Matches consented server-provided approximate distance only. Unknown distances do not match.'})}
     {field('interests','Interests',interests.map(item=>({value:item.id,label:categoryLabel(t,item.id)})),{searchable:true})}
    </>}
    <label className="text-sm font-semibold">City / public area<input aria-label="City / public area" className="mt-2 min-h-14 w-full rounded-2xl border border-violet-200 px-3" value={(draft.location||[]).join(', ')} onChange={e=>setDraft(prev=>({...prev,location:e.target.value.split(',').map(x=>x.trim()).filter(Boolean)}))}/></label>
    {tab==='nmoods'&&field('privacy','Visibility',[{value:'public',label:'Public'}],{help:'Nmood Shares discovery only shows publicly shared posts.'})}
    {tab!=='pals' && <>
     {!!availableCategories?.length && field('category','Category',availableCategories.map(value=>({value,label:categoryLabel(t,value)})),{searchable:true})}
     {!MAIN_PASSPORT && memberLocation && field('distance','Distance',distanceOptions)}
     {tab==='circles' && <>
      {field('shared_interests','Shared interests',interests.map(item=>({value:item.id,label:categoryLabel(t,item.id)})),{searchable:true})}
      {field('privacy','Privacy',[{value:'public',label:t('circle.privacy_public')},{value:'approval',label:t('circle.privacy_approval')}],{help:'Private Circles are visible only to invited members and do not appear in discovery.'})}
      {field('group_size','Group size',['small','medium','large'].map(value=>({value,label:t(`search.filter.group_size_${value}`)})))}
     </>}
     {(tab==='experiences'||tab==='all') && <>
      {tab==='experiences'&&<label className="text-sm font-semibold">Tags<input aria-label="Tags" className="mt-2 min-h-14 w-full rounded-2xl border border-violet-200 px-3" placeholder="Comma-separated tags" value={(draft.tags||[]).join(', ')} onChange={e=>setDraft(prev=>({...prev,tags:e.target.value.split(',').map(x=>x.trim()).filter(Boolean)}))}/></label>}
      {field('budget','Budget',[{value:'Free',label:'Free'},{value:'$',label:'AED 1–50'},{value:'$$',label:'Over AED 50–100'},{value:'$$$',label:'Over AED 100'}])}
      {field('privacy','Visibility',options(['public','approval']))}
      {field('date','Date',[{value:'today',label:'Today'},{value:'tomorrow',label:'Tomorrow'},{value:'weekend',label:'This weekend'},{value:'week',label:'This week'}])}
      {field('price','Price',[{value:'free',label:'Free'},{value:'paid',label:'Paid'}])}
      <fieldset className="space-y-2"><legend className="text-sm font-semibold">Quick toggles</legend>
       <label className="flex min-h-14 cursor-pointer items-center justify-between gap-3 rounded-2xl border border-violet-200 px-3 text-sm"><span>Free Only</span><input type="checkbox" className="h-5 w-5 accent-violet-700" checked={draft.price?.length===1&&draft.price[0]==='free'} onChange={e=>setDraft(prev=>({...prev,price:e.target.checked?['free']:[]}))}/></label>
       <label className="flex min-h-14 cursor-pointer items-center justify-between gap-3 rounded-2xl border border-violet-200 px-3 text-sm"><span>Available Spots</span><input type="checkbox" className="h-5 w-5 accent-violet-700" checked={draft.spots?.includes('available')||false} onChange={e=>setDraft(prev=>({...prev,spots:e.target.checked?['available']:[]}))}/></label>
      </fieldset>
     </>}
    </>}
   </div>
   <div className="shrink-0 flex gap-3 border-t border-violet-100 pt-3">
    <button type="button" onClick={clear} className="min-h-11 flex-1 rounded-xl border border-violet-200 px-3 text-sm font-semibold text-violet-800 focus-visible:outline-violet-600">Clear all</button>
    <button type="button" onClick={apply} className="min-h-11 flex-1 rounded-xl bg-violet-700 px-3 text-sm font-semibold text-white focus-visible:outline-violet-600">Apply filters</button>
   </div>
  </SheetContent>
 </Sheet>;
}
