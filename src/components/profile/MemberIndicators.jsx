import {mayDisplayIndicators,retainDistanceWithoutOldPresence} from '@/lib/indicator-display-state';
import { Capacitor } from '@capacitor/core';
import { MAIN_PASSPORT } from '@/lib/passport/enabled';
import React, {useEffect,useState,useRef,useSyncExternalStore} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {useAuth} from '@/lib/AuthContext';
import {callSupabaseRpc} from '@/api/supabaseClient';
import {distanceDisplayAllowed} from '@/lib/distance-display-permission';
import {withTimeout} from '@/lib/bounded-operation';
import {MEMBER_INDICATORS_ENABLED} from '@/lib/member-indicator-config';
import {INDICATORS_CHANGED,subscribeIndicatorForeground,getIndicatorForeground} from '@/lib/member-indicator-runtime';
export function safeMemberIndicators(value){
 const result={};
 if(Number.isInteger(value?.distance_km)&&value.distance_km>=0&&value.distance_km<=20020&&value.distance_km%5===0)result.distance_km=value.distance_km;
 if(value?.presence==='online')result.presence='online';
 else if(typeof value?.last_seen_bucket==='string'&&/^(?:m(?:[2-9]|[1-5][0-9])|h(?:[1-9]|1[0-9]|2[0-3])|d[1-6]|w[1-3]|long)$/.test(value.last_seen_bucket))result.last_seen_bucket=value.last_seen_bucket;
 return result;
}
// Card details come only from the existing viewer-authorized profile envelope.
export function safeCardProfile(envelope){
 if(!['full','teaser'].includes(envelope?.tier)||envelope.blocked||!envelope.profile)return null;
 const source=envelope.profile;
 return Object.fromEntries(['id','display_name','photo_url','gender','age','show_age','show_gender','city','looking_for_tags','looking_for','interests'].map(key=>[key,source[key]??null]));
}
export function lastSeenLabel(bucket){
 const safe=safeMemberIndicators({last_seen_bucket:bucket}).last_seen_bucket;
 if(!safe)return null;
 if(safe==='long')return 'Last seen a long time ago';
 const count=Number(safe.slice(1));const unit={m:'minute',h:'hour',d:'day',w:'week'}[safe[0]];
 return `Last seen ${count} ${unit}${count===1?'':'s'} ago`;
}
export default function MemberIndicators(props){
 if(!MEMBER_INDICATORS_ENABLED)return null;
 return <EnabledMemberIndicators {...props}/>;
}
export function useAuthorizedMemberIndicators({memberId,home=false,profile:requestedProfile=false,card=false}={}){
 const profile=MAIN_PASSPORT||requestedProfile;
 const {user,member}=useAuth();
 const foreground=useSyncExternalStore(subscribeIndicatorForeground,getIndicatorForeground,()=>false);
 const client=useQueryClient();const [,tick]=useState(0);const invalidatedAt=useRef(0);
 // Profile fields have their own authorized read: indicator consent, permissions
 // or runtime startup must not gate ordinary profile-card details.
 const profileQuery=useQuery({queryKey:['memberCardProfile',user?.id,memberId],enabled:profile&&!!user?.id&&!!memberId,retry:false,staleTime:0,refetchInterval:foreground?45000:false,refetchIntervalInBackground:false,
  queryFn:()=>withTimeout(signal=>callSupabaseRpc('nmood_get_member_profile',{p_member_id:memberId},{signal,expectedUserId:user.id}))});
 const enabled=MEMBER_INDICATORS_ENABLED&&!!user?.id&&(!profile||!!memberId&&profileQuery.isSuccess)&&foreground;
 const key=['memberIndicators',user?.id,...(card?['card']:[]),profile?String(memberId):home?'home':'people',...(MAIN_PASSPORT&&!card?[member?.show_distance===true]:[])];
 const query=useQuery({queryKey:key,enabled,retry:false,staleTime:0,refetchInterval:enabled?45000:false,refetchIntervalInBackground:false,
  queryFn:()=>withTimeout(async signal=>{
   const preferences=await callSupabaseRpc('nmood_get_my_indicator_preferences',{}, {signal,expectedUserId:user.id});
   const distanceAllowed=await distanceDisplayAllowed(preferences,{requireOwnSharing:!card}) && (!MAIN_PASSPORT || card || member?.show_distance===true);
   const distanceState=!preferences?'unavailable':preferences.distance_enabled!==true?'sharing_off':!(preferences.location_available??preferences.location_current)?'location_missing':!distanceAllowed?'permission_missing':'shared_location_missing';
   const sanitize=value=>{const safe=safeMemberIndicators(value);if(!distanceAllowed)delete safe.distance_km;return safe;};
   if(profile){const r=profileQuery.data;return (r?.tier==='full'||r?.tier==='teaser')&&!r.blocked?{[memberId]:sanitize(r.profile?.indicators),_distanceState:distanceState,_cardProfile:safeCardProfile(r)}:{_restricted:!!r?.blocked||r?.tier==='upgrade'||r?.tier==='unavailable'};}
   const rows=await callSupabaseRpc('nmood_list_member_indicators',{p_home:home},{signal,expectedUserId:user.id});
   return Object.fromEntries((Array.isArray(rows)?rows:[]).map(row=>[row.id,sanitize(row.indicators)]));
  })});
 useEffect(()=>{if(profileQuery.isSuccess)void client.invalidateQueries({queryKey:key,exact:true});},[client,user?.id,memberId,card,profileQuery.dataUpdatedAt,profileQuery.isSuccess]);
 useEffect(()=>{
  const clear=(event)=>{if(event?.type!=='nmood:refresh'&&event?.detail?.authorizedRefresh!==true){invalidatedAt.current=Date.now();tick(n=>n+1);}if(profile)void client.invalidateQueries({queryKey:['memberCardProfile',user?.id,memberId]});if(enabled)void client.invalidateQueries({queryKey:['memberIndicators']},{cancelRefetch:false});};
  let permission,disposed=false;
  if(enabled&&!Capacitor.isNativePlatform()&&navigator.permissions?.query)void Promise.resolve().then(()=>navigator.permissions.query({name:'geolocation'})).then(result=>{if(!disposed){permission=result;permission.addEventListener?.('change',clear);}}).catch(()=>{});
  window.addEventListener(INDICATORS_CHANGED,clear);
  window.addEventListener('nmood:refresh',clear);
  return()=>{disposed=true;permission?.removeEventListener?.('change',clear);window.removeEventListener(INDICATORS_CHANGED,clear);window.removeEventListener('nmood:refresh',clear);};
 },[client,query.refetch,enabled]);
 useEffect(()=>{if(!enabled)return;const id=setTimeout(()=>tick(n=>n+1),45000);return()=>clearTimeout(id);},[enabled,query.dataUpdatedAt]);
 const usable=mayDisplayIndicators({main:MAIN_PASSPORT,enabled,isError:query.isError,error:query.error,updatedAt:query.dataUpdatedAt,invalidatedAt:invalidatedAt.current});
 const retained=retainDistanceWithoutOldPresence(query.data,query.dataUpdatedAt);
 // A fresh server envelope that omits distance revokes the old value immediately.
 // Retention applies only while a replacement is pending, never across denial.
 if(profile&&profileQuery.isSuccess&&safeMemberIndicators(profileQuery.data?.profile?.indicators).distance_km===undefined&&retained?.[memberId])retained[memberId]={...retained[memberId],distance_km:undefined};
 return {usable,cardProfile:profileQuery.isSuccess?safeCardProfile(profileQuery.data):null,viewerInterests:member?.interests||[],indicators:usable?(retained||{}):{},restricted:profile&&(profileQuery.isError||profileQuery.isSuccess&&!safeCardProfile(profileQuery.data)),distanceState:query.isError?'unavailable':query.data?._distanceState};
}
export function DistanceUnavailable() {
 return <span>Distance unavailable</span>;
}
export function IndicatorLabels({value={},className='',showUnavailable=false,distanceState,distanceOnly=false}){
 const safe=safeMemberIndicators(value);
 if(!showUnavailable&&(!Object.keys(safe).length||(distanceOnly&&safe.distance_km===undefined)))return null;
 return <span className={`inline-flex max-w-full flex-wrap gap-x-2 gap-y-0.5 text-xs leading-4 ${className || 'text-muted-foreground'}`} aria-label="Member indicators">
 {!distanceOnly&&safe.presence==='online'&&<span>Online</span>}
 {safe.distance_km!==undefined ? <span title="Rounded distance from last shared device locations">{safe.distance_km===0?'Within 1 km.':`~${safe.distance_km} km away`}</span> : showUnavailable&&<DistanceUnavailable state={distanceState}/>}
 {!distanceOnly&&safe.last_seen_bucket&&<span>{lastSeenLabel(safe.last_seen_bucket)}</span>}
 </span>;
}
function EnabledMemberIndicators({memberId,home=false,profile=false,className='',showUnavailable=false,distanceOnly=false}){
 const {indicators,restricted,usable,distanceState}=useAuthorizedMemberIndicators({memberId,home,profile});
 if(restricted)return null;
 if(!usable)return showUnavailable ? <span className={className}><DistanceUnavailable state={distanceState}/></span> : null;
 const value=indicators[memberId] || {};
 return <IndicatorLabels value={value} className={className} showUnavailable={showUnavailable} distanceState={distanceState} distanceOnly={distanceOnly}/>;
}
