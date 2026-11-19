import {safeBoundaryReason} from './boundary-diagnostics.mjs';
import {ERRORS} from './contract.mjs';
const stages=new Set(['COUNTRY_DATASET','COUNTRY_LOCATION','COUNTRY_BOUNDARY']);
export function detectionFailureText(error){
 const message=error?.message==='denied'?ERRORS.denied:ERRORS.unavailable;
 if(!stages.has(error?.stage))return message;
 const detail=error.stage==='COUNTRY_BOUNDARY'&&error.boundaryReason!==undefined?` / ${safeBoundaryReason(error.boundaryReason)}`:'';
 return `${message} Reference: ${error.stage}${detail}`;
}
