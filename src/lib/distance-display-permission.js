import {locationPermissionState} from './location-permission-state';
import { MAIN_PASSPORT } from '@/lib/passport/enabled';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
// Additional presentation restriction over the authorized owner projection.
// Never request a position/permission or infer distance from country/city.
export async function distanceDisplayAllowed(preferences, { requireOwnSharing = true } = {}) {
 if(MAIN_PASSPORT && requireOwnSharing && preferences?.distance_enabled!==true)return false;
 const locationAvailable=MAIN_PASSPORT ? (preferences?.location_available ?? preferences?.location_current) : preferences?.location_current;
 if(preferences?.distance_calculation_enabled!==true || locationAvailable!==true)return false;
 try {
  if(Capacitor.isNativePlatform()){
   const permission=await Geolocation.checkPermissions();
   return locationPermissionState(permission)==='granted';
  }
  if(!navigator.permissions?.query)return false;
  return (await navigator.permissions.query({name:'geolocation'})).state==='granted';
 }catch{return false;} // An authorized projection still requires confirmed device permission.
}
