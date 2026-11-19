import React from 'react';
import {lookingForDetails,lookingForLabels} from '@/lib/display-detail';
import SmartImage from './SmartImage';
import {useAuthorizedMemberIndicators,IndicatorLabels} from '@/components/profile/MemberIndicators';
const text=value=>typeof value==='string'?value.trim():'';
// Input is an already-authorized public projection. Never consult raw member data.
export function profileSummary(person) {
 // Ages are shown only when the profile owner has explicitly elected to
 // share them. The public card never receives a date of birth.
 const age=person.show_age===true&&Number.isInteger(person.age)&&person.age>=18&&person.age<=99?String(person.age):'';
 const tags=lookingForDetails(person.looking_for_tags);
 const looking=tags.length?tags:person.looking_for;
 return {name:(text(person.display_name)||text(person.name))||'Member',demographic:age,city:text(person.city),looking:lookingForLabels(looking).slice(0,2)};
}
export function sharedCardInterests(person,viewerInterests=[]){
 const own=new Set(viewerInterests.filter(v=>typeof v==='string').map(v=>v.trim().toLowerCase()));
 return [...new Set((person.interests||[]).filter(v=>typeof v==='string'&&own.has(v.trim().toLowerCase())))];
}
export default function CompactProfile({person,memberId,home=false,renderText=value=>value}) {
 const id=memberId||person.user_id||person.created_by_id||person.id;
 const {cardProfile,indicators,restricted}=useAuthorizedMemberIndicators({memberId:id,home,card:true});
 // A fresh envelope replaces optional fields, so revoked/omitted values cannot
 // survive from an older feed row. Denials never fall back to that row.
 const visible=restricted?{id}:cardProfile?{...cardProfile,shared_interest_count:person.shared_interest_count}:person;
 const p=profileSummary(visible);
 const photo=Object.hasOwn(visible,'photo_url')?visible.photo_url:visible.avatar;
 const activity=restricted?{}:indicators?.[id]||{};
 return <>
  <SmartImage portraitPosition="50% 25%" src={photo} alt={`${p.name} photo`} rounded="rounded-none" className="discovery-image profile-card-image" fallback={<div className="flex h-full items-center justify-center bg-muted text-muted-foreground" aria-label="Image unavailable"><span aria-hidden="true" className="text-2xl">{p.name.charAt(0)}</span></div>}/>
  <div className="compact-profile-body">
   <h3 className="discovery-title" title={p.name}>{renderText(p.name)}{p.demographic && <span className="ml-1.5 font-normal text-muted-foreground">{renderText(p.demographic)}</span>}</h3>
   <div className="discovery-meta profile-location unified-location">{p.city&&<span className="truncate">{p.city}</span>}<span className="card-distance"><IndicatorLabels value={restricted?{}:indicators?.[id]} distanceOnly showUnavailable/></span></div>
   <div className="unified-activity"><IndicatorLabels value={{presence:activity.presence,last_seen_bucket:activity.last_seen_bucket}} showUnavailable={false}/></div>
   {p.looking.length>0&&<p className="unified-looking">{renderText(p.looking.join(' · '))}</p>}
  </div>
  <span className="unified-card-action">View profile</span>
 </>;
}
