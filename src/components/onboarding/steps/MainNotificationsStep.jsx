import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';
import { PUSH_PREFERENCES } from '@/lib/push-notifications';
import { getNotificationOnboardingState, notificationChoices, applyNotificationChanges, saveNotificationOnboarding } from '@/lib/onboarding-notifications';

const categoryLabels = {
  messages: 'Messages and replies', connections: 'Connections', circles: 'Circles and activity',
  experiences: 'Experiences', content_activity: 'Reactions and replies', account_security: 'Account and security',
  subscription: 'Subscriptions and purchases', safety_moderation: 'Safety and moderation', discovery_digest: 'Discovery digest',
};
function NotificationRow({ label, checked, onChange }) {
  return <label className="flex min-h-12 items-center justify-between gap-3 px-4 py-3">
    <span className="min-w-0 text-sm font-medium leading-5">{label}</span>
    <input className="h-5 w-5 shrink-0 accent-primary" type="checkbox" checked={checked} onChange={onChange}/>
  </label>;
}

export default function MainNotificationsStep({ data = {}, update, onNext, onNavigationBlockedChange }) {
  const { user } = useAuth();
  const [saved, setSaved] = useState(null), [changes, setChanges] = useState({});
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [attempt, setAttempt] = useState(0);
  const [unavailable, setUnavailable] = useState(false), [confirmed, setConfirmed] = useState(false);
  const active = useRef(false), locked = useRef(false), account = useRef(user?.id);
  account.current = user?.id;
  useEffect(() => {
    active.current = true; let current = true;
    const controller = new AbortController();
    setSaved(null); setChanges({}); setError(''); setUnavailable(false); setConfirmed(false);
    if (user?.id) getNotificationOnboardingState({ expectedUserId: user.id, signal: controller.signal })
      .then(value => { if (current) setSaved(value); })
      .catch(() => { if (current) setError('Saved notification choices could not be loaded. Retry, or continue without changing them.'); });
    return () => { current = false; active.current = false; controller.abort(); };
  }, [user?.id, attempt]);
  useEffect(() => { onNavigationBlockedChange?.(busy); }, [busy, onNavigationBlockedChange]);
  const clearPending = choices => {
    const pending = { ...data._settingsChanges };
    for (const key of ['notifications_enabled', 'notif_email', 'notif_circle']) delete pending[key];
    update({ _settingsChanges: pending, ...(choices ? { notifications_enabled: choices.enabled, notif_email: choices.email, notif_circle: choices.categories.circles } : {}) });
  };
  const continueStep = async (skip = false) => {
    if (locked.current || !user?.id) return;
    const actor = user.id; locked.current = true; setBusy(true); setError('');
    try {
      if (skip || confirmed) { if (skip) clearPending(); await onNext(); return; }
      const result = await saveNotificationOnboarding(changes, { expectedUserId: actor });
      if (!active.current || account.current !== actor) return;
      clearPending(result.choices); setConfirmed(true);
      if (result.pushAvailability === 'unavailable') { setUnavailable(true); return; }
      await onNext();
    } catch { if (active.current && account.current === actor) setError('Notification choices could not be saved. Retry, or continue without further changes.'); }
    finally { locked.current = false; if (active.current) setBusy(false); }
  };
  const choices = saved && applyNotificationChanges(notificationChoices(saved), changes);
  const change = patch => { setConfirmed(false); setUnavailable(false); setChanges(current => applyNotificationChanges({ categories: {}, ...current }, patch)); };
  return <section className="space-y-5">
    <p className="text-sm text-muted-foreground">Choose what you’d like to hear about. Notifications are optional.</p>
    {!saved && !error && <p role="status">Loading notification choices…</p>}
    {choices && <fieldset disabled={busy} className="min-w-0 space-y-4">
      <legend className="sr-only">Notification preferences</legend>
      <div className="overflow-hidden rounded-xl border bg-card divide-y">
        <NotificationRow label="Push notifications" checked={choices.enabled} onChange={e => change({ enabled: e.target.checked })}/>
        <NotificationRow label="Email notifications" checked={choices.email} onChange={e => change({ email: e.target.checked })}/>
      </div>
      <div className="overflow-hidden rounded-xl border bg-card divide-y">
        {PUSH_PREFERENCES.map(item => <NotificationRow key={item.id} label={categoryLabels[item.id] || item.label} checked={choices.categories[item.id]} onChange={e => change({ categories: { [item.id]: e.target.checked } })}/>) }
      </div>
    </fieldset>}
    <p className="text-sm text-muted-foreground">You can change these anytime in Settings.</p>
    <p className="text-sm">Continue requests iOS permission when push is enabled. Declining does not prevent onboarding or change your choices for other devices.</p>
    {unavailable && <p role="status">Push is unavailable on this device. Your notification choices are saved, but iOS permission or device registration is required to deliver push. You can enable it later in device Settings and Nmood Settings, or continue without device push.</p>}
    {error && <div role="alert"><p>{error}</p>{!saved && <button type="button" onClick={() => setAttempt(v => v + 1)}>Retry notification choices</button>}</div>}
    <Button className="w-full h-12" disabled={busy || !saved} onClick={() => continueStep()}>{busy ? 'Saving…' : unavailable ? 'Continue without device push' : 'Continue'}</Button>
    {error && <button type="button" disabled={busy} onClick={() => continueStep(true)}>Continue without further notification changes</button>}
  </section>;
}
