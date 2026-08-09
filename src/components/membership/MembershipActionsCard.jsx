import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { RotateCcw, HelpCircle } from 'lucide-react';
import { useMembershipAccess } from '@/components/membership/MembershipProvider';
import { trackMembershipEvent, MEMBERSHIP_EVENTS } from '@/lib/membership-analytics';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { detectStore } from '@/lib/native-billing-bridge';
import { isPaidSubscriptionsEnabled } from '@/lib/launch-mode';

export default function MembershipActionsCard() {
  const { t } = useLocalization();
  const { restore } = useMembershipAccess();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const handleRestore = async () => {
    setBusy(true);
    trackMembershipEvent(MEMBERSHIP_EVENTS.UPGRADE_CLICKED, { action: 'restore' });
    try {
      await restore(detectStore() || 'apple');
    } catch {
      // ignore
    }
    setBusy(false);
  };

  // Restore purchases is hidden when paid subscriptions are disabled.
  const actions = [
    ...(isPaidSubscriptionsEnabled() ? [
      { id: 'restore', label: t('membership.restore_purchases'), icon: RotateCcw, onClick: handleRestore },
    ] : []),
    { id: 'help', label: t('membership.help'), icon: HelpCircle, onClick: () => navigate('/help') },
  ];

  if (actions.length === 0) return null;

  return (
    <Card className="p-0 overflow-hidden">
      {actions.map((a, i) => {
        const Icon = a.icon;
        const disabled = busy && a.id === 'restore';
        return (
          <button
            key={a.id}
            type="button"
            onClick={a.onClick}
            disabled={disabled}
            className={`w-full flex items-center gap-3 p-4 hover:bg-muted/40 transition-default text-left ${i > 0 ? 'border-t border-border' : ''}`}
          >
            <Icon className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-medium flex-1">{a.label}</span>
            {disabled && <span className="text-xs text-muted-foreground">…</span>}
          </button>
        );
      })}
    </Card>
  );
}