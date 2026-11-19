import {useEffect, useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import {getExperienceById} from '@/api/contentRecords';
import {useAuth} from '@/lib/AuthContext';
import {useActivityRefresh} from '@/lib/activity-store';
import {normalizeExperience} from '@/lib/discover-store';
import {isRecordOwner} from '@/lib/content-ownership';
export function classifyMyExperiences(experiences,attendance,userId,now=Date.now()){
 const joinedIds=new Set(attendance.filter(a=>['going','confirmed','attended'].includes(a.status)).map(a=>String(a.experience_id)));
 const joined=experiences.filter(e=>joinedIds.has(String(e.id)));
 const ended=e=>{const date=Date.parse(e.source_date||e.date);return Number.isFinite(date)&&date<now;};
 return {joined:joined.map(e=>({...e,status:'confirmed'})),upcoming:joined.filter(e=>!ended(e)).map(e=>({...e,status:'confirmed'})),past:joined.filter(ended).map(e=>({...e,status:'attended',isPast:true})),hosted:experiences.filter(e=>isRecordOwner(e,userId)).map(e=>({...e,status:'host'}))};
}
export async function loadMyExperiences(userId){
 const [attendance,owned]=await Promise.all([base44.entities.Attendance.filter({created_by_id:userId},'-created_date',500),base44.entities.Experience.filter({created_by_id:userId},'-created_date',500)]);
 const records=new Map((owned||[]).map(e=>[String(e.id),e]));
 const ids=[...new Set((attendance||[]).filter(a=>['going','confirmed','attended'].includes(a.status)).map(a=>a.experience_id).filter(Boolean).map(String))];
 await Promise.all(ids.filter(id=>!records.has(id)).map(async id=>{const e=await getExperienceById(id);if(e)records.set(String(e.id),e);}));
 return {experiences:[...records.values()].map(normalizeExperience).filter(Boolean),attendance:attendance||[]};
}
export function useMyExperiences(){
 const {user}=useAuth();const activity=useActivityRefresh();
 const query=useQuery({queryKey:['myExperiences',user?.id,activity],queryFn:()=>loadMyExperiences(user.id),enabled:!!user?.id,retry:false});
 const data=query.data||{experiences:[],attendance:[]};
 const [savedIds, setSavedIds] = useState([]);
 useEffect(() => {
   if (typeof localStorage === 'undefined') return;
   try {
     const parsed = JSON.parse(localStorage.getItem('inmood_wishlist') || '[]');
     setSavedIds(Array.isArray(parsed) ? parsed.map(String) : []);
   } catch { setSavedIds([]); }
 }, [user?.id, activity]);
 const classified = classifyMyExperiences(data.experiences,data.attendance,user?.id);
 return {...classified,saved:data.experiences.filter((experience) => savedIds.includes(String(experience.id))).map((experience) => ({...experience,status:'saved'})),loading:query.isPending,error:query.isError,refresh:query.refetch};
}
