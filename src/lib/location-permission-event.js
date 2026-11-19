// Permission signal only: never carries a position, identity, or provider response.
export const LOCATION_PERMISSION_GRANTED='nmood:location-permission-granted';
export function notifyLocationPermissionGranted(){window.dispatchEvent(new Event(LOCATION_PERMISSION_GRANTED));}
