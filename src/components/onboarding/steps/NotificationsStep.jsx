import { MAIN_PASSPORT } from '@/lib/passport/enabled';
import MainNotificationsStep from './MainNotificationsStep';
import ReviewedSettingsFields from './ReviewedSettingsFields';
import {explicitSettings} from '@/lib/onboarding-settings';
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { enableNativePush } from '@/lib/push-notifications';
import { withTimeout } from '@/lib/bounded-operation';
function LegacyNotificationsStep({data={},update,onNext,onNavigationBlockedChange}) {
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const lock=useRef(false),active=useRef(true);
 useEffect(()=>{active.current=true;return()=>{active.current=false;};},[]);
 useEffect(()=>{onNavigationBlockedChange?.(busy);},[busy,onNavigationBlockedChange]);
 const next=async()=>{
  if(lock.current)return;lock.current=true;setBusy(true);setError('');
  try {
   if(explicitSettings(data,'notifications').notifications_enabled===true){
    await withTimeout(()=>enableNativePush());
    if(!active.current)return;
   }
   if(active.current)await onNext();
  } catch {if(active.current)setError('Notifications could not be updated. Try again, or leave push notifications off and continue.');}
  finally {lock.current=false;if(active.current)setBusy(false);}
 };
 return <section className="space-y-5">
  <p>Notifications are optional. Review these choices, then continue. Essential account and verification messages remain available.</p>
  <ReviewedSettingsFields data={data} update={update} step="notifications"/>
  <p className="text-sm text-muted-foreground">If push is enabled, Continue requests your device permission. You can decline without losing access.</p>
  {error&&<p role="alert">{error}</p>}
  <Button className="w-full h-12" disabled={busy} onClick={next}>{busy?'Saving…':'Continue'}</Button>
 </section>;
}

export default function NotificationsStep(props) {
 return MAIN_PASSPORT ? <MainNotificationsStep {...props}/> : <LegacyNotificationsStep {...props}/>;
}
