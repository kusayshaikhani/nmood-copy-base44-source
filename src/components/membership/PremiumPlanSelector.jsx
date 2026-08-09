import React, { useState } from 'react';
import { Check, Crown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PLANS } from '@/lib/membership-engine';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { trackMembershipEvent, MEMBERSHIP_EVENTS } from '@/lib/membership-analytics';
import { trackProductEvent, PRODUCT_EVENTS } from '@/lib/product-analytics';

// MP-001 — Premium plan selector with single-select radio cards and dynamic CTA.
// Single purchase entry point — onPurchase is the only billing hook; StoreKit
// and Google Play Billing can be integrated later without changing this UI.

const BADGE_STYLES = {
  best_value: 'bg-warning text-warning-foreground',
  most_flexible: 'bg-info text-info-foreground',
  try_premium: 'bg-accent text-accent-foreground',
};

const BADGE_KEYS = {
  best_value: 'membership.best_value',
  most_flexible: 'membership.most_flexible',
  try_premium: 'membership.try_premium',
};

export default function PremiumPlanSelector({ isPremium, onPurchase }) {
  const { t } = useLocalization();
  const [selected, setSelected] = useState('annual');
  const [busy, setBusy] = useState(false);

  const premiumPlans = PLANS.filter((p) => !p.isFree);
  const selectedPlan = premiumPlans.find((p) => p.id === selected) || premiumPlans[0];

  const handleSelect = (planId) => {
    if (planId === selected) return;
    setSelected(planId);
    trackMembershipEvent('Plan Selected', { plan: planId });
  };

  const handleContinue = async () => {
    if (isPremium || busy) return;
    setBusy(true);
    trackMembershipEvent('Continue Pressed', { plan: selected });
    trackMembershipEvent('Purchase Started', { plan: selected });
    trackProductEvent(PRODUCT_EVENTS.UPGRADE_CLICKED, { plan: selected });
    try {
      const result = await onPurchase(selected);
      if (result) {
        trackMembershipEvent('Purchase Completed', { plan: selected });
      } else {
        trackMembershipEvent('Purchase Failed', { plan: selected });
      }
    } catch {
      trackMembershipEvent('Purchase Failed', { plan: selected });
    }
    setBusy(false);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2.5">
        {premiumPlans.map((p) => {
          const active = selected === p.id;
          return (
            <button key={p.id} type="button" onClick={() => handleSelect(p.id)} className="w-full text-left">
              <Card
                className={
                  'p-4 flex items-center justify-between transition-default ' +
                  (active ? 'border-primary ring-1 ring-primary' : '')
                }
              >
                <div className="flex items-center gap-3">
                  <div
                    className={
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ' +
                      (active ? 'border-primary bg-primary' : 'border-border')
                    }
                  >
                    {active && <Check className="w-3 h-3 text-primary-foreground" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{p.label}</p>
                      {p.badge && (
                        <span
                          className={
                            'text-[10px] font-bold px-1.5 py-0.5 rounded-full ' +
                            (BADGE_STYLES[p.badge] || 'bg-muted text-muted-foreground')
                          }
                        >
                          {t(BADGE_KEYS[p.badge])}
                        </span>
                      )}
                    </div>
                    {p.fallbackPerMonth && (
                      <p className="text-xs text-muted-foreground">
                        {t('membership.only_per_month', { price: p.fallbackPerMonth })}
                      </p>
                    )}
                  </div>
                </div>
                <p className="font-bold text-sm flex-shrink-0">{p.fallbackPrice}</p>
              </Card>
            </button>
          );
        })}
      </div>

      <Button className="w-full gap-2" disabled={isPremium || busy} onClick={handleContinue}>
        <Crown className="w-4 h-4" />
        {isPremium
          ? t('membership.you_are_premium')
          : busy
            ? t('membership.processing')
            : `${t('membership.continue_cta')} \u2014 ${selectedPlan.fallbackPrice}`}
      </Button>
    </div>
  );
}