import {callSupabaseRpc,getSupabaseSession} from '@/api/supabaseClient';
import {matchesScope,scopeChanged,verifyCurrentScope} from './passport/response';
export async function readRecommendationPeople(limit,signal) {
 const scope=await callSupabaseRpc('nmood_get_explorer_scope',{}, {signal});
 if(!scope?.fingerprint||getSupabaseSession()?.user?.id!==scope.actor)throw scopeChanged();
 const rows=[];
 while(rows.length<limit){
  const size=Math.min(50,limit-rows.length);
  const result=await callSupabaseRpc('nmood_recommendation_discovery',{p_kind:'people',p_filters:{},p_query:'',p_offset:rows.length,p_limit:size,p_expected_fingerprint:scope.fingerprint},{signal,expectedUserId:scope.actor});
  if(result?.contract!=='discovery-search-1'||!matchesScope(scope,result.scope)||!Array.isArray(result.rows))throw scopeChanged();
  rows.push(...result.rows.slice(0,size));if(result.rows.length<=size)break;
 }
 await verifyCurrentScope(scope,signal);return rows;
}
