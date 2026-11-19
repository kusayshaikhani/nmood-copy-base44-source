// Retain only a previously authorized result. Explicit invalidation and auth errors
// always win; elapsed time alone expires presence, never a consented distance.
export function mayDisplayIndicators({main,enabled,updatedAt,invalidatedAt,isError,error,now=Date.now()}) {
 const transient=isError&&(error?.status>=500||error?.name==='TypeError'||error?.name==='AbortError'||error?.code==='TIMEOUT');
 return !!(enabled&&(!isError||(main&&transient))&&updatedAt&&updatedAt>=invalidatedAt&&(main||now-updatedAt<=21000));
}
export function retainDistanceWithoutOldPresence(data,updatedAt,now=Date.now()) {
 return Object.fromEntries(Object.entries(data||{}).map(([id,value])=>[id,now-updatedAt>21000&&value&&typeof value==='object'
  ? (Number.isInteger(value.distance_km)?{distance_km:value.distance_km}:{}) : value]));
}
