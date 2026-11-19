// Private delivery is a prerequisite, never an authorization source. Messages
// withdraw cached results; only a new authenticated scope read restores them.
export function watchDestinationDelivery({controller, transport, actor, events=window, documentTarget=document,initiallyForegrounded=true}) {
 let stopped=false, subscribed=false, foregrounded=initiallyForegrounded;
 const withdraw=()=>controller.suspend();
 const locate=()=>{if(!stopped&&subscribed&&foregrounded&&documentTarget.visibilityState!=='hidden')void controller.locate();};
 const invalidate=()=>{withdraw();if(!stopped&&subscribed&&foregrounded&&documentTarget.visibilityState!=='hidden')controller.revoke();};
 controller.setDelivery(false);
 try {
  transport.channel(`destination-scope:${actor}`,{config:{private:true}})
   .on('broadcast',{event:'invalidate'},invalidate)
   .subscribe(status=>{if(stopped)return;subscribed=status==='SUBSCRIBED';controller.setDelivery(subscribed);withdraw();if(subscribed)locate();});
 } catch {withdraw();}
 const offline=()=>{subscribed=false;controller.setDelivery(false);withdraw();};
 const visibility=()=>{withdraw();locate();};
 events.addEventListener('focus',locate);
 events.addEventListener('offline',offline);
 events.addEventListener('nmood:passport-entitlement-changed',invalidate);
 events.addEventListener('nmood:access-changed',invalidate);
 events.addEventListener('nmood:request-policy-changed',invalidate);
 events.addEventListener('nmood:passport-session-changed',offline);
 documentTarget.addEventListener('visibilitychange',visibility);
 return {foreground(active=true){foregrounded=active;visibility();},stop(){stopped=true;subscribed=false;controller.setDelivery(false);withdraw();
  events.removeEventListener('focus',locate);events.removeEventListener('offline',offline);
  events.removeEventListener('nmood:passport-entitlement-changed',invalidate);
  events.removeEventListener('nmood:access-changed',invalidate);
  events.removeEventListener('nmood:request-policy-changed',invalidate);
  events.removeEventListener('nmood:passport-session-changed',offline);
  documentTarget.removeEventListener('visibilitychange',visibility);
  void Promise.resolve(transport.removeAllChannels()).catch(()=>{});
  void Promise.resolve(transport.disconnect()).catch(()=>{});
 }};
}
