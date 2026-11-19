export function mapsBuildKey({mode,flavor,environment}) {
 const protectedWebBuild=mode==='production'&&flavor==='web'&&environment.NMOOD_PROTECTED_MAPS_WEB_BUILD==='1';
 const protectedAndroidBuild=mode==='production'&&flavor==='android'&&environment.NMOOD_PROTECTED_MAPS_ANDROID_BUILD==='1';
 if(!protectedWebBuild&&!protectedAndroidBuild)return '';
 const key=protectedAndroidBuild?environment.VITE_GOOGLE_MAPS_ANDROID_API_KEY:environment.VITE_GOOGLE_MAPS_API_KEY;
 if(typeof key!=='string'||!key.trim()||/\s/.test(key))throw Error('A private Maps browser build value is required.');
 return key;
}
