import React from 'react';
import { Card } from '@/components/ui/card';
import { Shield } from 'lucide-react';
import { useMembership } from '@/hooks/useMembership';
import { TIER_ORDER, MEMBERSHIP_TIERS } from '@/lib/membership';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function AdminTierSelector() {
  const { t } = useLocalization();
  const { tier, setTier } = useMembership();

  return (
    <Card className="p-4 mb-6 border-dashed">
      <div className="flex items-center gap-2 mb-1">
        <Shield className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">{t('membership.admin_change_plan')}</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        {t('membership.admin_demo_note')}
      </p>
      <div className="flex gap-2 flex-wrap">
        {TIER_ORDER.map((t2) => {
          const tierData = MEMBERSHIP_TIERS[t2];
          const isCurrent = t2 === tier;
          const btnClass = isCurrent
            ? 'bg-primary text-primary-foreground'
            : 'border border-border text-muted-foreground hover:bg-muted/40';
          return (
            <button
              key={t2}
              onClick={() => setTier(t2)}
              className={'px-3 py-1.5 rounded-lg text-xs font-medium transition-default ' + btnClass}
            >
              {tierData.name}
            </button>
          );
        })}
      </div>
    </Card>
  );
}