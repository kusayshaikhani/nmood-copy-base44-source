import {legacySearchFilters} from './legacy-search-filters';
import {useRef} from 'react';
import {useInfiniteQuery} from '@tanstack/react-query';
import {callSupabaseRpc} from '@/api/supabaseClient';
import {usePassportScope} from './passport/runtime';
import {matchesScope,scopeChanged,verifyCurrentScope} from './passport/response';
import {searchRequest} from './discovery-search-contract';
export function useContractDiscovery(kind,filters={},query='',enabled=true,mode='for_you'){
 const scope=usePassportScope();const current=useRef(scope.data);current.current=scope.data;
 const hasValidScope=Boolean(scope.data?.actor&&scope.data?.fingerprint);
 let args,error;try{args=searchRequest(kind,{...legacySearchFilters(kind,filters),...(mode==='new'||mode==='trending'?{discovery_mode:[mode]}:{})},query);}catch(e){error=e;}
 const result=useInfiniteQuery({queryKey:['discovery','recommendations-172',scope.data?.actor,scope.data?.fingerprint,args],initialPageParam:0,enabled:enabled&&hasValidScope&&!error,retry:false,
  queryFn:async({signal,pageParam})=>{
   const expected=scope.data;const response=await callSupabaseRpc('nmood_recommendation_discovery',{...args,p_offset:pageParam,p_expected_fingerprint:expected.fingerprint},{signal,expectedUserId:expected.actor});
   if(response?.contract!=='discovery-search-1'||!matchesScope(expected,response.scope)||!Array.isArray(response.rows))throw scopeChanged();
   await verifyCurrentScope(expected,signal);if(!matchesScope(expected,current.current))throw scopeChanged();return response;
  },getNextPageParam:(last,all)=>last.rows.length>20?all.length*20:undefined});
 const rows=!enabled||error||result.isError?[]:(result.data?.pages||[]).filter(p=>matchesScope(p.scope,scope.data)).flatMap(p=>p.rows.slice(0,20)).map(p=>({...p,name:p.name||p.display_name,avatar:p.photo_url||p.cover_photo||p.cover_image,photo:p.photo_url,languages:p.languages||[],interests:p.interests||[]}));
 return {...result,rows,loading:result.isFetching,isError:!!error||result.isError,unsupported:error?.message,scopeMissing:!hasValidScope};
}
