import {Capacitor} from '@capacitor/core';
import {Geolocation} from '@capacitor/geolocation';
import {locationPermissionState} from './location-permission-state';
// Called only after the onboarding Use my location action. Keep time spent
// answering the OS dialog outside the subsequent bounded location lookup.
export async function requestOnboardingLocationPermission() {
 if(!Capacitor.isNativePlatform())return true;
 let permission=await Geolocation.checkPermissions();
 if(locationPermissionState(permission)==='unresolved')permission=await Geolocation.requestPermissions({permissions:['location']});
 return locationPermissionState(permission)==='granted';
}
