import {Capacitor} from '@capacitor/core';
import {Geolocation} from '@capacitor/geolocation';
import {withTimeout} from '@/lib/bounded-operation';
export function validNmoodPoint(p){return Number.isFinite(p?.lat)&&Number.isFinite(p?.lng)&&Math.abs(p.lat)<=90&&Math.abs(p.lng)<=180;}
// Device-only coordinates: no reverse geocoder, telemetry or network request here.
export async function requestNmoodLocation(){
 return withTimeout(async()=>{
  let position;
  if(Capacitor.isNativePlatform()){
   let permission=await Geolocation.checkPermissions();
   if(['prompt','prompt-with-rationale'].includes(permission.location))permission=await Geolocation.requestPermissions({permissions:['location']});
   if(permission.location!=='granted')throw new Error('Location permission is not enabled. Choose a point on the map instead.');
   position=await Geolocation.getCurrentPosition({enableHighAccuracy:false,timeout:12000,maximumAge:60000});
  }else{
   position=await new Promise((resolve,reject)=>{
    if(!navigator.geolocation){reject(new Error('Unavailable'));return;}
    navigator.geolocation.getCurrentPosition(resolve,reject,{enableHighAccuracy:false,timeout:12000,maximumAge:60000});
   });
  }
  const p={lat:position?.coords?.latitude,lng:position?.coords?.longitude};
  if(!validNmoodPoint(p))throw new Error('Unavailable');return p;
 },15000);
}
