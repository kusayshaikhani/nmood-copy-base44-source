const customerBuild=typeof __NMOOD_ISOLATED_CUSTOMER_TEST__!=='undefined'&&__NMOOD_ISOLATED_CUSTOMER_TEST__===true;
export const ISOLATED_ORIGIN='https://iyxxorbmucsrechxkkxj.supabase.co';
const routes=new Set([...(customerBuild?['/auth/v1/signup','/auth/v1/resend']:['/functions/v1/passport-isolated-synthetic-v1']),'/auth/v1/token','/functions/v1/nmood-isolated-app-v1','/functions/v1/nmood-country-attestation-v1']);
export function permittedIsolatedRequest(value,method='GET') {
 let url;try{url=new URL(typeof value==='string'?value:value.url);}catch{return false;}
 if(url.origin!==ISOLATED_ORIGIN||url.username||url.password||url.hash||method.toUpperCase()!=='POST'||!routes.has(url.pathname))return false;
 return url.pathname==='/auth/v1/token'?url.search==='?grant_type=password':url.search==='';
}
export function installIsolatedNetworkBoundary(target=window){
 const nativeFetch=target.fetch.bind(target);
 target.fetch=(value,options={})=>{
  const url=new URL(typeof value==='string'?value:value.url,target.location.href),method=options.method||value?.method||'GET';
  const bundledDataset=url.protocol===target.location.protocol&&url.host===target.location.host&&url.origin===target.location.origin&&(url.pathname==='/country-verification/natural-earth-10m-v5.1.1.json'||url.pathname.startsWith('/assets/')||url.pathname.startsWith('/_capacitor_file_/'))&&!url.search&&!url.hash&&method==='GET';
  if(!bundledDataset&&!permittedIsolatedRequest(url.href,method))return Promise.reject(Error('ISOLATED_NETWORK_DENIED'));
  return nativeFetch(value,{...options,credentials:'omit',redirect:'error',cache:'no-store'});
 };
 // No alternate web transports or retained production realtime connections.
 const denied=()=>{throw Error('ISOLATED_NETWORK_DENIED');};
 for(const name of ['XMLHttpRequest','WebSocket','EventSource','Worker','SharedWorker'])Object.defineProperty(target,name,{value:class{constructor(){denied();}},writable:false,configurable:false});
 if(target.navigator)Object.defineProperty(target.navigator,'sendBeacon',{value:()=>false,configurable:false});
}
