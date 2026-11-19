import React, { useRef, useState } from 'react';
import { genderOptions } from '@/lib/onboarding-data';

// Deliberately no native picker, portal, focus trap or bridge. This control only
// updates the parent's draft; Continue owns validation and the existing save RPC.
export default function OnboardingGenderField({ value, update }) {
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const busy = useRef(false);
  const valid = value === '' || value == null || genderOptions.some(option => option.value === value);
  const choose = async next => {
    if (busy.current) return;
    if (next !== '' && !genderOptions.some(option => option.value === next)) { setFailed(true); return; }
    busy.current = true; setSaving(true); setFailed(false);
    try {
      await update({ gender: next });
    } catch (error) {
      setFailed(true);
      // Fixed category only: never record the value, draft, or exception text.
      try { window.NmoodRecovery?.record?.(error, 'PROFILE-GENDER'); } catch { /* optional diagnostics */ }
    } finally { busy.current = false; setSaving(false); }
  };
  return <div className="space-y-2">
    <label id="onboarding-gender-label" className="text-sm font-medium">I am a</label>
    <div role="group" aria-labelledby="onboarding-gender-label" className="grid grid-cols-2 gap-3">
      {genderOptions.map(option => <button key={option.value} type="button" aria-pressed={value === option.value} disabled={saving}
        className={`min-h-12 rounded-xl border px-3 text-sm font-semibold ${value === option.value ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-card'}`}
        onClick={() => choose(option.value)}>{option.value === 'male' ? 'Man' : 'Woman'}</button>)}
    </div>
    {saving && <p role="status">Updating selection…</p>}
    {(failed || !valid) && <p role="alert">Please choose Gender again. Your other details are kept.</p>}
  </div>;
}
