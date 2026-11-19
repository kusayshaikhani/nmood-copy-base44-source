import pin from './dataset-pin.json';
import {safeDetection,matchCountry,safeState} from './contract.mjs';
import {requestOfflineCountry} from './device.mjs';
// All dependencies are explicit: no window registry, localStorage authority,
// unsigned client self-certification, or production fallback transport.
export function createCountryClient({actor,countries,transport,attest,detect=requestOfflineCountry}){
 const invoke=async(operation,payload={})=>safeState(await transport(operation,payload,{expectedUserId:actor}),actor);
 return {actor,countries,detect,read:()=>invoke('status'),save:patch=>invoke('preferences',patch),
  async confirm({country,detection}){
   const result=matchCountry(country,safeDetection(detection));
   if(typeof attest!=='function')throw Error('unavailable');
   const proof=await attest({actor,country:result.country,detectedAt:result.detectedAt,dataset:pin.sha256});
   if(typeof proof!=='string'||!proof||proof.length>4096)throw Error('unavailable');
   return invoke('confirm',{country:result.country,proof});
  },
 };
}
