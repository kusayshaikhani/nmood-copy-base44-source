// Actual app runtime. Constructed only after release gating and server readiness.
import {createDestinationController} from './destination-scope.js';
export function createVerifiedPassportRuntime({approved=false,actor,api,detect,clear,transport,getToken,now=Date.now,initiallyForegrounded=true}) {
 if(!approved)return null;
 const controller=createDestinationController({actor,api:{...api,
  area:async(...args)=>{await api.area(...args);if(!await proof())throw Error('DELIVERY_UNAVAILABLE');return api.read();},
  passport:async(...args)=>{await api.passport(...args);if(!await proof())throw Error('DELIVERY_UNAVAILABLE');return api.read();}
 },detect,clear,now,requireDelivery:true});
 let active=initiallyForegrounded,located=false,stopped=false,connected=false,epoch=0,flight=null,channel,pending=null;
 const cancel=()=>{if(pending){clearTimeout(pending.timer);clearTimeout(pending.retryTimer);pending.resolve(false);pending=null;}};
 const loss=()=>{connected=false;epoch++;cancel();controller.setDelivery(false);};
 async function proof(){
  if(stopped||!connected||!active)return false;
  if(pending)return pending.promise;
  const own=epoch;let resolve;
  const promise=new Promise(r=>{resolve=r;});
  const record={promise,resolve,own,used:false,timer:setTimeout(()=>{if(pending===record){pending=null;resolve(false);}},12000)};
  pending=record;
  try{await api.challenge();}catch(error){
   if(pending===record&&(error?.code==='DELIVERY_CHALLENGE_RATE_LIMIT'||error?.message==='DELIVERY_CHALLENGE_RATE_LIMIT')){
    record.retryTimer=setTimeout(()=>{if(pending===record&&connected&&!stopped&&record.own===epoch)void api.challenge().catch(()=>{if(pending===record){clearTimeout(record.timer);pending=null;resolve(false);}});},2100);
   }else if(pending===record){clearTimeout(record.timer);pending=null;resolve(false);}
  }
  return promise;
 }
 async function receipt(message){
  const record=pending,data=message?.payload;
  if(!record||record.used||record.own!==epoch||!connected||stopped)return;
  if(!data||Object.keys(data).some(k=>!['nonce','revision'].includes(k))||!/^[a-f0-9]{64}$/.test(data.nonce)||!Number.isSafeInteger(data.revision)||data.revision<1)return;
  record.used=true;let valid=false;
  try{valid=await api.receipt(data.nonce,data.revision)===true;}catch{/* No raw proof, token or response logging. */}
  if(pending===record){clearTimeout(record.timer);clearTimeout(record.retryTimer);pending=null;record.resolve(valid&&record.own===epoch&&connected&&!stopped);}
 }
 async function reconcile(){
  if(stopped||!connected||!active)return;
  const own=epoch;
  if(!await proof()){if(!stopped&&own===epoch)loss();return;}
  if(stopped||!connected||own!==epoch)return;
  controller.setDelivery(true);
  if(controller.getSnapshot().status==='ready')await controller.renew();else {await controller.refresh();if(!located&&active&&connected&&controller.getSnapshot().status==='unavailable'){located=true;await controller.locate();}}
 }
 const ready=(async()=>{try{
  const token=await getToken();if(stopped)return;if(typeof token!=='string'||!token)throw Error('AUTH_REQUIRED');
  await transport.setAuth(token);if(stopped)return;
  channel=transport.channel(`destination-scope:${actor}`,{config:{private:true}})
   .on('broadcast',{event:'verify_delivery'},message=>{void receipt(message);})
   .on('broadcast',{event:'invalidate'},()=>{if(stopped)return;epoch++;cancel();controller.suspend();void reconcile();})
   .subscribe(status=>{if(stopped)return;if(status!=='SUBSCRIBED'){loss();return;}if(connected)return;connected=true;epoch++;if(active)void reconcile();});
 }catch{if(!stopped)loss();}})();
 return {controller,ready,
  foreground(value){active=value;if(!value){epoch++;cancel();controller.setDelivery(false);}},
  withdraw(){epoch++;cancel();controller.setDelivery(false);},
  invalidate(){epoch++;cancel();controller.suspend();if(connected&&!stopped)return reconcile();return Promise.resolve();},
  pulse(){if(stopped||!connected||!active)return Promise.resolve();if(flight)return flight;flight=reconcile().finally(()=>{flight=null;});return flight;},
  async stop(){stopped=true;loss();controller.stop();if(channel)await transport.removeChannel(channel);await transport.disconnect();}
 };
}

export const PASSPORT_CLIENT_CONTRACT='passport-rehearsal-client-v3';
export function validPassportReadiness(value,actor,now=Date.now()){
 return value?.contract===PASSPORT_CLIENT_CONTRACT&&value.actor===actor&&value.enabled===true
 &&value.transport==='invoker-envelope-v1'&&value.maps==='reauthorized-image-v1'
 &&value.adapter_count===29&&value.participation==='legacy-typed-replay-v3'
 &&value.delivery==='own-receive-proof-v1'&&Number.isFinite(value.expires)
 &&value.expires>now&&value.expires-now<=30000;
}
// No channel, location request or scope write before authenticated server readiness.
export function connectRehearsalPassport({enabled=false,actor,api,createTransport,getToken,detect,clear,onReady=()=>{},onUnsupported=()=>{},onBlocked=()=>{},events=window,documentTarget=document,now=Date.now}){
 let stopped=false,runtime,interval,everReady=false,foregrounded=true;const removers=[];
 const visible=()=>foregrounded&&documentTarget.visibilityState!=='hidden';
 const bounded=fn=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('READINESS_TIMEOUT')),8000);Promise.resolve().then(fn).then(resolve,reject).finally(()=>clearTimeout(timer));});
 const block=()=>{runtime?.withdraw();clear();onBlocked();};
 let pulseFlight;
 async function pulse(){if(stopped||!runtime||!visible())return;if(pulseFlight)return pulseFlight;
  pulseFlight=(async()=>{try{const ready=await bounded(()=>api.ready());if(stopped||!visible())return;if(!validPassportReadiness(ready,actor,now())){block();return;}await runtime.pulse();}catch{if(!stopped)block();}})().finally(()=>{pulseFlight=null;});return pulseFlight;
 }
 const ready=(async()=>{
  if(!enabled||!actor){onUnsupported();return;}
  try{const confirmation=await bounded(()=>api.ready());if(stopped)return;
   if(!validPassportReadiness(confirmation,actor,now())){if(confirmation?.enabled===false&&confirmation.contract===PASSPORT_CLIENT_CONTRACT&&confirmation.actor===actor)onUnsupported();else block();return;}
   runtime=createVerifiedPassportRuntime({approved:true,actor,api,detect,clear,transport:createTransport(),getToken,now,initiallyForegrounded:visible()});everReady=true;onReady(runtime.controller);await runtime.ready;
   if(stopped)return;
   const listen=(target,event,fn)=>{target.addEventListener(event,fn);removers.push(()=>target.removeEventListener(event,fn));};
   listen(events,'offline',block);listen(events,'online',()=>{void pulse();});
   listen(events,'focus',()=>{void pulse();});
   listen(documentTarget,'visibilitychange',()=>{runtime.foreground(visible());if(visible())void pulse();});
   for(const event of ['nmood:subscription-changed','nmood:membership-changed','nmood:passport-entitlement-changed','nmood:access-changed','nmood:request-policy-changed'])listen(events,event,()=>{void runtime.invalidate();});
   listen(events,'nmood:passport-session-changed',block);
   interval=setInterval(()=>{void pulse();},10000);
  }catch(error){if(stopped)return;if(!everReady&&(error?.status===404||error?.code==='PGRST202'))onUnsupported();else block();}
 })();
 return {ready,pulse,foreground(active){foregrounded=active;runtime?.foreground(active&&documentTarget.visibilityState!=='hidden');if(active)void pulse();},async stop(){stopped=true;clearInterval(interval);removers.forEach(fn=>fn());await runtime?.stop();}};
}
