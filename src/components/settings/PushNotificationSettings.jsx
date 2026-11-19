import React, { useEffect, useState } from 'react';
import { Bell, ChevronDown, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import PremiumSettingsRow from '@/components/settings/premium/PremiumSettingsRow';
import { disablePushForThisDevice, enableNativePush, getPushPreferences, PUSH_PREFERENCES, savePushPreferences } from '@/lib/push-notifications';
export default function PushNotificationSettings() {
  const [state, setState] = useState({ enabled: false, categories: {} });
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { getPushPreferences().then((value) => value && setState(value)).catch(() => {}); }, []);
  const update = async (next, requestPermission = false) => {
    if (busy) return;
    setBusy(true); setError('');
    try {
      if (requestPermission) await enableNativePush();
      if (!next.enabled) await disablePushForThisDevice();
      setState(await savePushPreferences(next));
    } catch (e) { setError(e?.message || 'Notification settings could not be saved.'); }
    finally { setBusy(false); }
  };
  return <>
    <PremiumSettingsRow icon={Bell} tone="primary" title="Push notifications" subtitle="Choose exactly which Nmood alerts reach this device"
      trailing={busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Switch checked={state.enabled} onCheckedChange={(enabled) => update({ ...state, enabled }, enabled)} />}
      searchKeys={['push', 'notifications']} />
    <button type="button" className="w-full px-4 py-3 flex items-center justify-between text-sm" onClick={() => setExpanded((v) => !v)}>
      Notification categories <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
    </button>
    {expanded && <div className="px-4 pb-3 space-y-2">{PUSH_PREFERENCES.map((item) => <label key={item.id} className="min-h-11 flex items-center justify-between gap-3 text-sm">
      <span className="min-w-0">{item.label}</span><Switch disabled={!state.enabled || busy} checked={state.categories?.[item.id] ?? item.id !== 'discovery_digest'} onCheckedChange={(enabled) => update({ ...state, categories: { ...state.categories, [item.id]: enabled } })} />
    </label>)}</div>}
    {error && <p role="alert" className="px-4 pb-3 text-xs text-destructive">{error}</p>}
  </>;
}
