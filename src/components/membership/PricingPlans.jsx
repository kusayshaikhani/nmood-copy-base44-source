import React, { useState } from 'react';
import { Check, Crown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PLANS } from '@/lib/membership-engine';
import { useMembershipAccess } from '@/components/membership/MembershipProvider';
import { trackMembershipEvent, MEMBERSHIP_EVENTS } from '@/lib/membership-analytics';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function PricingPlans() {
  const { t } = useLocalization();
  const { isPremium, purchase } = useMembershipAccess();
  const [selected, setSelected] = useState('annual');
  const [busy, setBusy] = useState(false);

  const handleUpgrade = async () => {
    setBusy(true);
    trackMembershipEvent(MEMBERSHIP_EVENTS.UPGRADE_CLICKED, { plan: selected, source: 'pricing' });
    try {
      await purchase(selected);
    } catch {
      // ignore
    }
    setBusy(false);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2.5">
        {PLANS.map((p) => {
          const active = selected === p.id;
          return (
            <button key={p.id} type="button" onClick={() => setSelected(p.id)} className="w-full text-left">
              <Card className={`p-4 flex items-center justify-between transition-default ${active ? 'border-primary ring-1 ring-primary' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${active ? 'border-primary bg-primary' : 'border-border'}`}>
                    {active && <Check className="w-3 h-3 text-primary-foreground" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{p.label}</p>
                      {p.bestValue && (
                        <span className="text-[10px] font-bold bg-warning text-warning-foreground px-1.5 py-0.5 rounded-full">
                          {t('membership.best_value')}
                        </span>
                      )}
                    </div>
                    {p.fallbackPerMonth && <p className="text-xs text-muted-foreground">{p.fallbackPerMonth}</p>}
                  </div>
                </div>
                <p className="font-bold text-sm">{p.fallbackPrice}</p>
              </Card>
            </button>
          );
        })}
      </div>
      <Button className="w-full gap-2" disabled={isPremium || busy} onClick={handleUpgrade}>
        <Crown className="w-4 h-4" /> {isPremium ? t('membership.you_are_premium') : busy ? t('membership.processing') : t('membership.upgrade_heading')}
      </Button>
      <p className="text-center text-[11px] text-muted-foreground">
        {t('membership.subscriptions_billed')}
      </p>
    </div>
  );
}