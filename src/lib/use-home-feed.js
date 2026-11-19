import {retryHomeFeed} from './home-feed-retry';
import {useEffect,useRef} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {callSupabaseRpc} from '@/api/supabaseClient';
import {usePassportScope} from '@/lib/passport/runtime';
import {matchesScope,scopeChanged,verifyCurrentScope} from '@/lib/passport/response';
import {useFeedRefresh} from '@/lib/feed-refresh';
import {MEMBERSHIP_CHANGED_EVENT} from '@/lib/subscription-service';
import {recentHomeViews} from '@/lib/home-seen';
export function useHomeFeed(){
 const scope=usePassportScope();const current=useRef(scope.data);current.current=scope.data;const client=useQueryClient();
 const enabled=!!scope.data?.actor&&!!scope.data?.country;
 useFeedRefresh(enabled);
 useEffect(()=>{const changed=()=>{void client.invalidateQueries({queryKey:['passportScope']});void client.invalidateQueries({queryKey:['discovery','home-for-you']});};window.addEventListener(MEMBERSHIP_CHANGED_EVENT,changed);return()=>window.removeEventListener(MEMBERSHIP_CHANGED_EVENT,changed);},[client]);
 const query=useQuery({queryKey:['discovery','home-for-you',scope.data?.actor,scope.data?.fingerprint],enabled,retry:retryHomeFeed,retryDelay:attempt=>Math.min(500*2**attempt,2000),staleTime:0,refetchOnMount:'always',refetchOnWindowFocus:false,
  queryFn:async({signal})=>{
   const expected=scope.data;const rotation=crypto.randomUUID();
   const response=await callSupabaseRpc('nmood_home_feed',{p_rotation_id:rotation,p_seen:recentHomeViews(expected.actor).map(v=>v.key),p_expected_fingerprint:expected.fingerprint},{signal,expectedUserId:expected.actor}).catch(error=>{if(error?.code==='PT409'||error?.code==='EXPLORER_SCOPE_CHANGED'||String(error?.message).includes('EXPLORER_SCOPE_CHANGED'))throw scopeChanged();throw error;});
   if(response?.contract!=='home-for-you-1'||response.rotation_id!==rotation||!Array.isArray(response.groups)||!matchesScope(expected,response.scope))throw scopeChanged();
   const kinds=new Set();for(const group of response.groups){if(!['people','circles','experiences','posts'].includes(group.kind)||kinds.has(group.kind)||!Array.isArray(group.rows)||group.rows.length>6||group.rows.some(r=>!r?.id))throw scopeChanged();kinds.add(group.kind);}
   await verifyCurrentScope(expected,signal);if(!matchesScope(expected,current.current))throw scopeChanged();return response;
  }});
 const visible=enabled&&!query.isError&&matchesScope(query.data?.scope,scope.data);
 return {groups:visible?query.data.groups:[],actor:scope.data?.actor,rotation:query.data?.rotation_id,loading:scope.isLoading||(query.isFetching&&!visible),refreshing:query.isFetching,error:scope.isError||query.isError,scopeMissing:!scope.isLoading&&!enabled,refresh:()=>scope.isError||query.error?.code==='EXPLORER_SCOPE_CHANGED'?client.invalidateQueries({queryKey:['passportScope']}):query.refetch({cancelRefetch:false})};
}
