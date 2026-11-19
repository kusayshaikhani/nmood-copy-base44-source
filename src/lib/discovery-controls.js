import {SEARCH_FIELDS} from './discovery-search-contract';
// Operates only on server-authorized, already matched cards. Never reads hidden data.
export function peopleCategoryFilters(filters = {}) {
  const values=filters?.category||filters?.categories;return {...Object.fromEntries(Object.entries(filters||{}).filter(([k])=>SEARCH_FIELDS.people.includes(k))),...(values?.length?{interests:values}:{})};
}
const stamp = item => Date.parse(item?.created_at || item?.created_date || '') || 0;
const activity = item => {
  // Only explicit public aggregate counts, never private profile preferences.
  const values = [item.member_count, item.attendee_count, item.like_count];
  return Math.max(0, ...values.filter(v => typeof v === 'number' && Number.isFinite(v)));
};
export function discoveryQuickResults(items, mode, now = Date.now()) {
  if (mode === 'new') return items.filter(item => stamp(item) > 0 && stamp(item) <= now && stamp(item) >= now - 30 * 86400000).sort((a,b) => stamp(b)-stamp(a) || String(a.id).localeCompare(String(b.id)));
  if (mode === 'trending') return [...items].sort((a,b) => activity(b)-activity(a) || stamp(b)-stamp(a) || String(a.id).localeCompare(String(b.id)));
  return items;
}
export const discoveryModeDescription = mode => mode === 'in_orbit' ? 'People with shared interests you are allowed to see.' : mode === 'new' ? 'New in the last 30 days.' : mode === 'trending' ? 'Loaded matches ordered by available public activity, then newest.' : '';

export function filtersForKind(kind,filters={}) {
 const result=kind==='people'?peopleCategoryFilters(filters):{...filters};
 if(kind!=='people'&&result.categories){result.category=result.categories;delete result.categories;}
 return Object.fromEntries(Object.entries(result).filter(([key,value])=>SEARCH_FIELDS[kind].includes(key)&&value!=null&&(Array.isArray(value)?value.length:true)));
}

export function supportsDiscoveryFilters(kind,filters={}) {
 return Object.entries(filters||{}).every(([key,value])=>!value||(Array.isArray(value)&&!value.length)||value==='Any Budget'||SEARCH_FIELDS[kind].includes(key==='categories'||key==='category'?(kind==='people'?'interests':'category'):key));
}
