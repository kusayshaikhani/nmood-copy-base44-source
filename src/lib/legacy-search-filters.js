import {searchRequest} from './discovery-search-contract';
export function legacySearchFilters(kind,filters={}){
 const result={};
 for(const [key,value] of Object.entries(filters||{})){
  if(value==null||value===false||(Array.isArray(value)&&!value.length))continue;
  // The visible 18–99 range is the neutral UI state, not an active age
  // filter. Sending it to the server would hide profiles that chose not to
  // share an age even when the member did not filter by age.
  if((key==='age_min'&&Number(value)===18)||(key==='age_max'&&Number(value)===99))continue;
  if(key==='budget'&&value==='Any Budget')continue;
  const target=key==='freeOnly'?'price':key==='availableSpots'?'spots':key==='looking_for'?'looking_for_tags':key==='categories'?'category':key;
  const values=(key==='freeOnly'?['free']:key==='availableSpots'?['available']:Array.isArray(value)?value:[String(value)])
   .map(v=>key==='gender'?({men:'male',women:'female'}[v]||v):String(v))
   // Tagalog is the current member-facing name. Include the former Filipino
   // value so older profiles continue to match without a data migration.
   .flatMap(v=>key==='languages'&&v.trim().toLowerCase()==='tagalog'?[v,'Filipino']:[v])
   .filter(v=>{const neutral=v.trim().toLowerCase();return neutral!==''&&neutral!=='any'&&neutral!=='everyone';});
  if(!values.length)continue;
  result[target]=values;
 }
 return searchRequest(kind,result,'').p_filters;
}
