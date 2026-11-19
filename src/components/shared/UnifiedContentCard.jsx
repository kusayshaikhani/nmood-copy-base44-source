import {whenOptions,groupSizeOptions} from '@/lib/nmood-schedule-options';
import {displayDetail} from '@/lib/display-detail';
import React from 'react';
import {Link,useLocation} from 'react-router-dom';
import SmartImage from './SmartImage';
const text=displayDetail;
const count=value=>typeof value==='number'&&Number.isInteger(value)&&value>=0?value:null;
const members=(value,label)=>value===null?'':`${value} ${label}${value===1?'':'s'}`;
const join=(...values)=>values.filter(Boolean).join(' · ');
export function contentCardDetails(kind,row) {
 const city=text(row.city)||text(row.location_city)||text(row.location);
 const start=join(text(row.date),text(row.time)||text(row.startTime));
 const participants=count(row.participant_count)??count(row.attendee_count)??count(row.member_count);
 const capacity=count(row.max_attendees)??count(row.capacity);
 const places=count(row.available_spots)??(capacity!==null&&participants!==null?Math.max(0,capacity-participants):null);
 const attendance=places===null?members(participants,'participant'):`${places} ${places===1?'place':'places'} available`;
 if(kind==='circles') {
  const privacy={public:'Public',private:'Private',approval:'Approval required',invite_only:'Invite only'}[row.privacy||row.visibility]||'';
  const activity=text(row.latest_activity)||text(row.last_activity_at);
  return [join(members(count(row.member_count),'member'),privacy),text(row.category)||text(row.main_topic),activity];
 }
 if(kind==='experiences') {
  const budget=typeof row.budget==='number'&&Number.isFinite(row.budget)&&row.budget>=0?String(row.budget):text(row.budget);
  const currency=text(row.currency)||(row.country_code==='AE'?'AED':'');
  const cost=/^(free|0(?:\.0{1,2})?)$/i.test(budget)?'Free':budget&&currency&&/^\d/.test(budget)?`${currency} ${budget}`:budget;
  return [start,join(cost,attendance),join(city,text(row.location_type)||text(row.category))];
 }
 const schedule=start||join(text(row.custom_date),text(row.custom_time))||(row.when!=='custom'?whenOptions.find(option=>option.id===row.when)?.label:'');
 const group=groupSizeOptions.find(option=>option.id===row.group_size)?.label;
 return [join(text(row.category),text(row.intention_text)),schedule,join(attendance,group)];
}
// Only authorized listing projections are accepted. Never infer member details
// from a host, private address, coordinates or gallery.
export default function UnifiedContentCard({kind,row,renderText=v=>v,href}) {
 const location=useLocation();
 const name=text(row.display_name)||text(row.name)||text(row.title)||text(row.member_first_name)||({posts:'Nmood Share',circles:'Circle',experiences:'Experience'}[kind]);
 const lines=contentCardDetails(kind,row);
 const action={circles:'View circle',experiences:'View experience',posts:'View Nmood share'}[kind];
 const route={circles:'circle',experiences:'experience',posts:'nmood'}[kind];
 // Shares have no authorized cover field in the search contract.
 const image=kind==='posts'?null:row.cover_photo||row.cover_image||row.image;
 // Preserve an invite context only while a member is choosing an Experience.
 const inviteParams=kind==='experiences'&&!href?new URLSearchParams(location.search):null;
 const inviteQuery=inviteParams?.get('invite')?`?${inviteParams.toString()}`:'';
 const destination=href||`/${route}/${encodeURIComponent(row.id)}${inviteQuery}`;
 return <article data-search-card={kind} className="discovery-card compact-discovery-card unified-card"><Link className="compact-profile-link" to={destination} aria-label={`Open ${name}`}>
  <SmartImage portraitPosition="50% 15%" src={image} alt="" rounded="rounded-none" className="discovery-image" fallback={<div className="unified-card-placeholder" aria-hidden="true"/>}/>
  <div className="compact-profile-body"><h3 className="discovery-title">{renderText(name)}</h3>{lines.map((line,index)=>line?<p key={index} className={index===0?'unified-location':index===1?'unified-activity':'unified-looking'}>{renderText(line)}</p>:null)}</div>
  <span className="unified-card-action">{action}</span>
 </Link></article>;
}
