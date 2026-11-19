import {safeBoundaryReason} from '../../country-verification/boundary-diagnostics.mjs';
import {Capacitor} from '@capacitor/core';
import {Geolocation} from '@capacitor/geolocation';
import pin from './dataset-pin.json';
import isoCodes from '../../country-verification/iso-codes.json';
import {resolveCountry,validateCountryPosition} from './geometry.mjs';
let cached;
async function loadPinnedDataset(){
 if(!cached)cached=(async()=>{
  // Fixed bundled resource only: never a location-bearing URL or remote geocoder.
  const response=await fetch(pin.path,{credentials:'omit',cache:'no-store',redirect:'error'});
  if(!response.ok)throw Error('unavailable');const bytes=await response.arrayBuffer();
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');
  if(hash!==pin.sha256)throw Error('unavailable');return JSON.parse(new TextDecoder().decode(bytes));
 })().catch(()=>{cached=null;throw Error('unavailable');});
 return cached;
}
async function readPosition(){
 if(Capacitor.isNativePlatform()){
  let permission=await Geolocation.checkPermissions();
  if(['prompt','prompt-with-rationale'].includes(permission.location))permission=await Geolocation.requestPermissions({permissions:['location']});
  if(permission.location!=='granted'&&permission.coarseLocation!=='granted')throw Error('denied');
  // Native coarse mode requests 3 km accuracy, incompatible with the 1 km resolver limit.
  return Geolocation.getCurrentPosition({enableHighAccuracy:true,maximumAge:0,timeout:15000});
 }
 if(!navigator.geolocation)throw Error('unavailable');
 return new Promise((resolve,reject)=>navigator.geolocation.getCurrentPosition(resolve,reject,{enableHighAccuracy:false,maximumAge:0,timeout:15000}));
}
function bounded(promise,ms,signal){
 return new Promise((resolve,reject)=>{
  let finished=false;
  const finish=(fn,value)=>{if(finished)return;finished=true;clearTimeout(timer);signal?.removeEventListener('abort',abort);fn(value);};
  const abort=error=>finish(reject,error?.message==='denied'?Error('denied'):Error('unavailable'));
  const timer=setTimeout(abort,ms);signal?.addEventListener('abort',abort,{once:true});
  if(signal?.aborted)abort();
  Promise.resolve(promise).then(value=>finish(resolve,value),error=>finish(reject,error?.message==='denied'?Error('denied'):Error('unavailable')));
 });
}
export function createOfflineCountryDetector({getPosition=readPosition,loadDataset=loadPinnedDataset,now=Date.now}={}){
 return async({signal}={})=>{
  let position,stage='COUNTRY_DATASET';
  try{
   if(signal?.aborted)throw Error('unavailable');const data=await bounded(loadDataset(),15000,signal);
   if(signal?.aborted)throw Error('unavailable');stage='COUNTRY_LOCATION';position=await bounded(getPosition().catch(error=>{if(error?.code===1||error?.message==='denied'||['OS-PLUG-GLOC-0003','OS-PLUG-GLOC-0008'].includes(error?.code))throw Error('denied');throw Error('unavailable');}),20000,signal);
   if(signal?.aborted)throw Error('unavailable');const time=now();validateCountryPosition(position,time);stage='COUNTRY_BOUNDARY';const country=resolveCountry(position,data,isoCodes,time);
   return {...country,detectedAt:time};
  }catch(error){
   const denied=error?.message==='denied'||error?.code===1||['OS-PLUG-GLOC-0003','OS-PLUG-GLOC-0008'].includes(error?.code);
   const failure=Error(denied?'denied':'unavailable');
   failure.stage=stage; // Fixed category only. Never retain the original error or position.
   if(stage==='COUNTRY_BOUNDARY')failure.boundaryReason=safeBoundaryReason(error?.boundaryReason);
   throw failure;
  }finally{position=null;}
 };
}
export const requestOfflineCountry=createOfflineCountryDetector();
