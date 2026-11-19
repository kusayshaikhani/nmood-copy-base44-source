import { REGION_ENABLED } from './region-config';
import { passportRequestMode } from './passport-adapters';
let active=null;
export function registerDestinationController(actor,controller){const registration={actor,controller};active=registration;return()=>{if(active===registration)active=null;};}
export function beginDestinationRequest(path,actor){
 if(!REGION_ENABLED||!active)return null;
 const mode=passportRequestMode(path);
 if(mode==='server-only')throw new Error('This operation requires server authorization.');
 if(!active.controller)return null;
 const scoped=mode==='regional'||path.startsWith('/functions/v1/nmood-public-place-map-preview');
 if(!scoped)return null;
 if(!active||active.actor!==actor)throw new Error('Discovery scope is unavailable.');
 return {actor,controller:active.controller,ticket:active.controller.ticket()};
}
export function acceptDestinationRequest(value,actor,body){if(value){if(body?.contract!=='country-passport-destination-v2'||body?.revision!==value.ticket.revision||body?.actor!==actor||!Number.isFinite(body?.expires)||body.expires<=Date.now()||body.expires>Date.now()+30000||!Object.prototype.hasOwnProperty.call(body,'data'))throw new Error('Server destination enforcement is unavailable.');if(active?.controller!==value.controller||active.actor!==actor)throw new Error('Session changed.');value.controller.accept(value.ticket);}}

export function destinationOwnsSession(actor){return REGION_ENABLED&&active?.actor===actor;}

export function acceptDestinationImage(value,actor,response){
 if(!value)return;
 acceptDestinationRequest(value,actor,{contract:response.headers.get('x-nmood-destination-contract'),actor:response.headers.get('x-nmood-destination-actor'),revision:Number(response.headers.get('x-nmood-destination-revision')),expires:Number(response.headers.get('x-nmood-destination-expires')),data:null});
}
