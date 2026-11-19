// Input members are the existing server-authorized projection. Distances must
// come only from the fresh authorized indicator map, never from member fields.
export function createdTime(item) {
 const time=Date.parse(item.created_at || item.created_date || '');
 return Number.isFinite(time)?time:0;
}
export function roundedDistance(value) {
 const distance=value?.distance_km;
 return Number.isInteger(distance)&&distance>=5&&distance<=20020&&distance%5===0?distance:Infinity;
}
export function newestMembers(members,authorizedIndicators={}) {
 return [...members].sort((a,b)=>createdTime(b)-createdTime(a)
  || (roundedDistance(authorizedIndicators[a.id])-roundedDistance(authorizedIndicators[b.id]) || 0)
  || String(a.id).localeCompare(String(b.id)));
}
