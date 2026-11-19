import { COUNTRIES } from './master-data';
export const DESTINATION_CONTRACT = 'country-passport-destination-v2';
const countries=new Set(COUNTRIES.map(c=>c.iso2));
export function countryCode(value){if(!countries.has(value))throw new Error('Choose one country.');return value;}
export function areaInput(value){
 if(!value||Object.keys(value).some(k=>!['country','city'].includes(k))||typeof value.city!=='string'||!value.city.trim()||value.city.length>100)throw new Error('Choose your country and city.');
 return {country:countryCode(value.country),city:value.city.trim()};
}
export function checkedDestination(value,actor,now=Date.now()){
 if(value?.contract!==DESTINATION_CONTRACT||value.actor!==actor||!Number.isSafeInteger(value.revision)||value.revision<1||!['local','manual','passport'].includes(value.mode)||typeof value.premium!=='boolean'||!Number.isFinite(value.expires)||value.expires<=now||value.expires-now>30000)throw new Error('Discovery scope is unavailable.');
 const country=countryCode(value.country);const city=value.mode==='passport'?null:areaInput({country,city:value.city}).city;
 if(value.mode==='passport'&&!value.premium)throw new Error('Premium is required for Passport.');
 return Object.freeze({contract:DESTINATION_CONTRACT,actor,revision:value.revision,mode:value.mode,premium:value.premium,country,city,expires:value.expires});
}
// Session state only. No storage, Home Country update, coordinate or IP fallback.
export function createDestinationController({actor,api,detect,clear=()=>{},now=Date.now,timeout=35000,requireDelivery=false}){
 let deliveryAvailable=!requireDelivery;
 let state=Object.freeze({status:'checking',scope:null,error:null}),generation=0,timer;const listeners=new Set();
 const publish=patch=>{state=Object.freeze({...state,...patch});listeners.forEach(fn=>fn());};
 const withdraw=()=>{generation++;clearTimeout(timer);clear();publish({status:'checking',scope:null,error:null});return generation;};
 const bounded=operation=>new Promise((resolve,reject)=>{const id=setTimeout(()=>reject(new Error('Location timed out.')),timeout);Promise.resolve().then(operation).then(resolve,reject).finally(()=>clearTimeout(id));});
 async function run(operation){const version=withdraw();try{if(!deliveryAvailable)throw new Error();const value=checkedDestination(await bounded(operation),actor,now());if(version!==generation)return;publish({status:'ready',scope:value,error:null});timer=setTimeout(()=>{void refresh();},Math.max(1,value.expires-now()));}catch{if(version===generation)publish({status:'unavailable',scope:null,error:'Discovery could not be confirmed. Retry.'});}}
 async function refresh(){return run(()=>api.read());}
 // Opt-in renewal used by the isolated sandbox heartbeat. Retain only an
 // unexpired, unchanged authorized scope; the existing expiry timer stays live
 // while the read is pending. Revocation/generation changes invalidate replies.
 async function renew(){
  if(!deliveryAvailable||state.status!=='ready'||state.scope.expires<=now())return;
  const version=generation,prior=state.scope;
  try{const value=checkedDestination(await bounded(()=>api.renew?api.renew():api.read()),actor,now());
   if(version!==generation||!deliveryAvailable||state.status!=='ready')return;
   const same=['actor','revision','mode','premium','country','city'].every(k=>value[k]===prior[k]);
   if(!same){withdraw();publish({status:'ready',scope:value,error:null});}
   else publish({scope:value});
   clearTimeout(timer);timer=setTimeout(()=>{void refresh();},Math.max(1,value.expires-now()));
  }catch{if(version===generation)this.suspend();}
 }
 async function locate(){if(!deliveryAvailable)return;const version=withdraw();try{const result=await bounded(detect);if(version!==generation)return;if(result?.source!=='gps')throw new Error();const area=areaInput({country:result.countryCode,city:result.city});return run(()=>api.area(area,'device'));}catch{if(version===generation)publish({status:'manual',scope:null,error:'Location is unavailable. Choose your country and city manually.'});}}
 return {setDelivery(available){deliveryAvailable=available;if(!available)this.suspend();},suspend(){withdraw();publish({status:'unavailable',error:'Discovery is unavailable until a secure connection is restored.'});},subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);},getSnapshot:()=>state,locate,refresh,renew,
  manual(value){const area=areaInput(value);return run(()=>api.area(area,'manual'));},
  passport(country){countryCode(country);if(state.scope?.premium!==true)throw new Error('Premium is required for Passport.');return run(()=>api.passport(country));},
  off(){return run(()=>api.passport(null));},revoke(){withdraw();void refresh();},
  ticket(){if(state.status!=='ready'||state.scope.expires<=now())throw new Error('Discovery scope is unavailable.');return {actor,revision:state.scope.revision,generation};},
  accept(ticket){if(state.status!=='ready'||ticket.actor!==actor||ticket.generation!==generation||ticket.revision!==state.scope.revision||state.scope.expires<=now())throw new Error('Discovery changed. Retry.');},
  stop(){withdraw();listeners.clear();}
 };
}
