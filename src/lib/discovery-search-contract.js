import { SMART_KEYS } from './smart-search';
// Stable API keys. OR within a selection; AND across different filters.
export const SEARCH_FIELDS = {
 people: ['activity','age_min','age_max','gender','dating_looking_for_gender','looking_for_tags','interests','languages','zodiac','marital_status','family_plan','smoking','drinking','distance','location','orbit_interests'],
 circles: ['category','privacy','shared_interests','group_size','location'],
 experiences: ['category','tags','privacy','budget','price','spots','date','location'],
 posts: ['category','privacy','location'],
};
export const SEARCH_UNAVAILABLE = {
 people: 'Only shared, authorized profile fields can match. Distance uses consented approximate distance; unknown values cannot match.',
 circles: 'Location matches public venue labels. Group size uses the listed capacity.',
 experiences: 'Budget bands use the entire listed AED range. Unknown prices or capacity do not match a selected filter.',
 posts: 'Only authorized Shares and public location labels can match.',
};
export function searchRequest(kind, filters, query, offset = 0, smart = false) {
 if (!SEARCH_FIELDS[kind]) throw new Error('Unsupported search type');
 const selected = {};
 for (const [key, values] of Object.entries(filters)) {
  if ((!SEARCH_FIELDS[kind].includes(key) && key!=='discovery_mode' && !(smart && SMART_KEYS.includes(key))) || !Array.isArray(values) || values.some(v => typeof v !== 'string')) throw new Error('Unsupported filter');
  const normalized = [...new Set(values.map(v=>v.trim()).filter(Boolean))];
  if (normalized.length) selected[key] = normalized;
 }
 return {p_kind:kind,p_filters:selected,p_query:query.trim(),p_offset:offset,p_limit:20};
}
