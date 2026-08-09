import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, RotateCcw, HelpCircle, XCircle } from 'lucide-react';
import { useMembershipAccess } from '@/components/membership/MembershipProvider';
import { trackMembershipEvent, MEMBERSHIP_EVENTS } from '@/lib/membership-analytics';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { detectStore } from '@/lib/native-billing-bridge';

export default function PremiumManager() {
  const { t } = useLocalization();
  const { membership, cancel, restore } = useMembershipAccess();
  const [busy, setBusy] = useState(null);

  const handleCancel = async () => {
    if (!window.confirm(t('membership.cancel_confirm'))) return;
    setBusy('cancel');
    try {
      await cancel(membership?.payment_provider || detectStore() || 'apple');
    } catch {
      // ignore
    }
    setBusy(null);
  };

  const handleRestore = async () => {
    setBusy('restore');
    trackMembershipEvent(MEMBERSHIP_EVENTS.UPGRADE_CLICKED, { action: 'restore' });
    try {
      await restore(membership?.payment_provider || detectStore() || 'apple');
    } catch {
      // ignore
    }
    setBusy(null);
  };

  const actions = [
    { id: 'billing', label: t('membership.billing'), icon: CreditCard },
    { id: 'restore', label: t('membership.restore_purchase'), icon: RotateCcw, onClick: handleRestore },
    { id: 'help', label: t('membership.help'), icon: HelpCircle },
  ];

  return (
    <div className="space-y-3">
      <Card className="p-0 overflow-hidden">
        {actions.map((a, i) => {
          const Icon = a.icon;
          return (
            <button
              key={a.id}
              type="button"
              onClick={a.onClick}
              disabled={busy === a.id}
              className={`w-full flex items-center gap-3 p-4 hover:bg-muted/40 transition-default text-left ${i > 0 ? 'border-t border-border' : ''}`}
            >
              <Icon className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-medium flex-1">{a.label}</span>
              {busy === a.id && <span className="text-xs text-muted-foreground">…</span>}
            </button>
          );
        })}
      </Card>
      <Button
        variant="outline"
        className="w-full gap-2 text-destructive hover:text-destructive"
        disabled={busy === 'cancel'}
        onClick={handleCancel}
      >
        <XCircle className="w-4 h-4" /> {t('membership.cancel_membership')}
      </Button>
    </div>
  );
}