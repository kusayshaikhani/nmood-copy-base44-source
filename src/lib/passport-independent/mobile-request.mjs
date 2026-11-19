import {Capacitor,CapacitorHttp} from '@capacitor/core';
const base='https://iyxxorbmucsrechxkkxj.supabase.co';
const customerBuild=typeof __NMOOD_ISOLATED_CUSTOMER_TEST__!=='undefined'&&__NMOOD_ISOLATED_CUSTOMER_TEST__===true;
const allowed=new Set([base+'/auth/v1/token?grant_type=password',base+'/functions/v1/nmood-isolated-app-v1',...(customerBuild?[base+'/auth/v1/signup',base+'/auth/v1/resend']:[base+'/functions/v1/passport-isolated-synthetic-v1'])]);
// Native Android HTTPS avoids changing the app's origin or the hosted CORS policy.
// It is scoped to the fixed isolated endpoints; ordinary app requests still use fetch.
export function createMobileRequest({platform=()=>Capacitor.getPlatform(),native=options=>CapacitorHttp.request(options),web=(...args)=>fetch(...args)}={}){
 return async(url,options)=>{
  if(!allowed.has(url)||options.method!=='POST'||options.redirect!=='error'||options.credentials!=='omit')throw Error('TRANSPORT_BOUNDARY');
  if(platform()!=='android')return web(url,options);
  if(options.signal?.aborted)throw Error('CANCELLED');
  const response=await native({url,method:'POST',headers:options.headers,data:options.body,responseType:'json',disableRedirects:true,connectTimeout:10000,readTimeout:20000});
  // Native requests cannot be cancelled; never accept a response after logout/timeout.
  if(options.signal?.aborted||response.url!==url)throw Error('CANCELLED_OR_REDIRECTED');
  return {status:response.status,json:async()=>response.data};
 };
}
export const mobileRequest=createMobileRequest();
