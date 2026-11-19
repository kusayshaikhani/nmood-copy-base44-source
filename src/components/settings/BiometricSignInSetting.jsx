import React, { useEffect, useState } from 'react';
import { Fingerprint } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import PremiumSettingsRow from '@/components/settings/premium/PremiumSettingsRow';
import {
  getBiometricAvailability,
  isBiometricSignInEnabled,
  setBiometricSignInEnabled,
} from '@/lib/biometric-auth';

export default function BiometricSignInSetting() {
  const [available, setAvailable] = useState(false);
  const [enabled, setEnabled] = useState(isBiometricSignInEnabled);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getBiometricAvailability().then((result) => setAvailable(Boolean(result.isAvailable))).catch(() => setAvailable(false));
  }, []);

  if (!available) return null;
  const change = async (next) => {
    if (busy) return;
    setBusy(true);
    try {
      await setBiometricSignInEnabled(next);
      setEnabled(next);
    } finally {
      setBusy(false);
    }
  };

  return (
    <PremiumSettingsRow
      icon={Fingerprint}
      tone="success"
      title="Biometric sign-in"
      subtitle="Optional Face ID, Touch ID, or supported Android biometrics"
      trailing={<Switch aria-label="Biometric sign-in" checked={enabled} disabled={busy} onCheckedChange={change} />}
      searchKeys={['biometric', 'face id', 'touch id', 'fingerprint', 'sign in']}
    />
  );
}
