// Coarse permission is sufficient. Unknown/prompt is not proof of revocation.
export function locationPermissionState(permission) {
 if(permission?.location==='granted'||permission?.coarseLocation==='granted')return 'granted';
 if(permission?.location==='denied'||permission?.coarseLocation==='denied')return 'denied';
 return 'unresolved';
}
