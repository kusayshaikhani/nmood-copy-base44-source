export const MAPS_ORIGIN = 'https://app.nmood.app';
export const MAPS_FRAME_URL = MAPS_ORIGIN + '/maps/';
export const MAPS_PARENT_ORIGINS = new Set(['capacitor://localhost', MAPS_ORIGIN]);
export function validChannel(value) { return typeof value==='string' && /^[a-f0-9]{32}$/.test(value); }
export function newMapChannel() { return Array.from(crypto.getRandomValues(new Uint8Array(16)),v=>v.toString(16).padStart(2,'0')).join(''); }
export function frameMessage(event, source, channel) {
 return !!source && event.source===source && event.origin===MAPS_ORIGIN && validChannel(channel) && event.data?.channel===channel && event.data?.protocol==='nmood-map-1';
}
export function parentMessage(event, parent, channel) {
 return parent!==window && event.source===parent && MAPS_PARENT_ORIGINS.has(event.origin) && validChannel(channel) && event.data?.channel===channel && event.data?.protocol==='nmood-map-1' && event.data?.type==='init';
}
// Only explicitly selected venue data crosses the boundary. Never copy an
// arbitrary provider object, device location, identity, session or history.
export function venueSelection(value) {
 if(!value || typeof value!=='object' || Array.isArray(value))return null;
 const allowed=['coordinates','venueName','address','area','city','country'];
 if(Object.keys(value).some(k=>!allowed.includes(k)))return null;
 const c=value.coordinates;
 if(!Array.isArray(c)||c.length!==2||!c.every(Number.isFinite)||Math.abs(c[0])>90||Math.abs(c[1])>180)return null;
 const result={coordinates:[...c]};
 for(const k of allowed.slice(1)){if(value[k]!==undefined&&typeof value[k]!=='string')return null;const s=value[k]||'';if(s.length>500||/[\u0000-\u001f]/.test(s))return null;result[k]=s;}
 return result.address.trim()||result.venueName.trim()?result:null;
}
export function pickVenue(value) { return venueSelection(Object.fromEntries(['coordinates','venueName','address','area','city','country'].map(k=>[k,value?.[k]]))); }
