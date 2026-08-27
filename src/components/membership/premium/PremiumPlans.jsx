import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Crown } from 'lucide-react';
import { PLANS } from '@/lib/membership-engine';
import { useMembershipAccess } from '@/components/membership/MembershipProvider';
import { trackMembershipEvent } from '@/lib/membership-analytics';
import { trackProductEvent, PRODUCT_EVENTS } from '@/lib/product-analytics';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { RotateCcw, Settings } from 'lucide-react';
import { subscriptionOfferings } from '@/lib/subscription-service';
import { useAuth } from '@/lib/AuthContext';
import { Capacitor } from '@capacitor/core';
import WebPurchasePrompt from '@/components/membership/WebPurchasePrompt';

// UI-023 — Beautiful pricing cards with selection-lift animation.
// Preserves the exact purchase flow from PremiumPlanSelector (onPurchase hook).
const BADGE_TONE = {
  best_value: 'bg-nmood-gradient text-primary-foreground',
  most_flexible: 'bg-info/15 text-info border border-info/30',
  try_premium: 'bg-accent/40 text-accent-foreground border border-accent/50',
};

export default function PremiumPlans() {
  const { t } = useLocalization();
  const { isPremium, purchase, restore, cancel, billingPlatform } = useMembershipAccess();
  const { user } = useAuth();
  const [selected, setSelected] = useState('annual');
  const [busy, setBusy] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [prices, setPrices] = useState({});
  const [availablePlans, setAvailablePlans] = useState(null);
  const [webPurchasePromptOpen, setWebPurchasePromptOpen] = useState(false);
  const isNativeStore = Capacitor.isNativePlatform();

  const premiumPlans = PLANS.filter((p) => !p.isFree && (availablePlans === null || availablePlans.has(p.id)));
  const selectedPlan = premiumPlans.find((p) => p.id === selected) || premiumPlans[0];

  // RevenueCat is the installed native purchase integration. The old custom
  // Billing bridge was never registered in Capacitor and blocked TestFlight
  // purchases before a store sheet could open.
  React.useEffect(() => {
    if (!isNativeStore) return undefined;
    let active = true;
    subscriptionOfferings({ user }).then((details) => {
      const map = {};
      details.forEach((d) => { if (d.planId) map[d.planId] = d; });
      if (active) {
        setPrices(map);
        setAvailablePlans(new Set(details.map((d) => d.planId)));
      }
    }).catch(() => { if (active) setAvailablePlans(new Set()); });
    return () => { active = false; };
  }, [user?.id, isNativeStore]);

  const monthlyAmount = prices.monthly?.priceAmount || 0;
  const getPlanPrice = (p) => p ? (prices[p.id]?.price || p.fallbackPrice || '') : '';
  const getPlanPerMonth = (p) => {
    if (!p) return '';
    if (prices[p.id]?.priceAmount && p.durationDays) {
      const pm = prices[p.id].priceAmount / (p.durationDays / 30);
      return `${prices[p.id].currency || 'USD'} ${pm.toFixed(2)}`;
    }
    return p.fallbackPerMonth || '';
  };
  const getPlanSavings = (p) => {
    if (monthlyAmount > 0 && p.durationDays && prices[p.id]?.priceAmount) {
      const months = p.durationDays / 30;
      const fullPrice = monthlyAmount * months;
      return Math.round((1 - prices[p.id].priceAmount / fullPrice) * 100);
    }
    return 0;
  };

  const handleRestore = async () => {
    if (restoring) return;
    setRestoring(true);
    try {
      await restore();
    } catch { /* ignore */ }
    setRestoring(false);
  };

  const handleSelect = (planId) => {
    if (planId === selected) return;
    setSelected(planId);
    trackMembershipEvent('Plan Selected', { plan: planId });
  };

  const handleContinue = async () => {
    if (isPremium || busy) return;
    if (!selectedPlan) return;
    if (!isNativeStore) {
      trackMembershipEvent('Continue Pressed', { plan: selected, channel: 'web' });
      trackProductEvent(PRODUCT_EVENTS.UPGRADE_CLICKED, { plan: selected, channel: 'web' });
      setWebPurchasePromptOpen(true);
      return;
    }
    setBusy(true);
    trackMembershipEvent('Continue Pressed', { plan: selected });
    trackMembershipEvent('Purchase Started', { plan: selected });
    trackProductEvent(PRODUCT_EVENTS.UPGRADE_CLICKED, { plan: selected });
    try {
      const result = await purchase(selected);
      if (result) trackMembershipEvent('Purchase Completed', { plan: selected });
      else trackMembershipEvent('Purchase Failed', { plan: selected });
    } catch {
      trackMembershipEvent('Purchase Failed', { plan: selected });
    }
    setBusy(false);
  };

  return (
    <div>
      <div className="px-1 mb-4">
        <h2 className="font-heading text-xl font-bold tracking-tight">{t('membership.premium.plans_title')}</h2>
        <p className="text-[13px] text-muted-foreground mt-0.5">{t('membership.premium.plans_subtitle')}</p>
      </div>

      {availablePlans?.size === 0 ? (
        <p className="rounded-card border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-muted-foreground">Premium plans are not available from the store yet. Please try again shortly.</p>
      ) : (
      <div className="grid grid-cols-2 gap-3">
        {premiumPlans.map((p) => {
          const active = selected === p.id;
          const recommended = p.badge === 'best_value';
          return (
            <motion.button
              key={p.id}
              type="button"
              onClick={() => handleSelect(p.id)}
              whileTap={{ scale: 0.97 }}
              animate={{ y: active ? -4 : 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              className={`relative text-start rounded-card border p-4 transition-colors ${
                active
                  ? 'border-primary bg-primary/5 shadow-elevated'
                  : 'border-border/60 bg-card shadow-soft'
              }`}
            >
              {p.badge && (
                <span
                  className={`absolute top-3 end-3 text-[9.5px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                    BADGE_TONE[p.badge] || 'bg-muted text-muted-foreground'
                  }`}
                >
                  {p.badge === 'best_value' ? t('membership.premium.recommended') : t(`membership.${p.badge === 'most_flexible' ? 'most_flexible' : 'try_premium'}`)}
                </span>
              )}

              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center mb-3 mt-1 ${
                  active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground/50 border border-border'
                }`}
              >
                {active ? <Check className="w-4 h-4" strokeWidth={3} /> : <Crown className="w-4 h-4" strokeWidth={2} />}
              </div>

              <p className="font-heading text-[17px] font-bold leading-tight">{p.label}</p>
              <p className="text-[15px] font-bold mt-0.5">{getPlanPrice(p)}</p>
              {getPlanPerMonth(p) && (
                <p className="text-[11.5px] text-muted-foreground mt-0.5">
                  {t('membership.premium.per_month', { price: getPlanPerMonth(p) })}
                </p>
              )}
              {getPlanSavings(p) > 0 && (
                <p className="text-[11.5px] font-semibold text-success mt-0.5">
                  {t('membership.premium.savings', { percent: getPlanSavings(p) })}
                </p>
              )}
            </motion.button>
          );
        })}
      </div>
      )}

      <motion.button
        type="button"
        whileTap={{ scale: 0.98 }}
        disabled={isPremium || busy || !selectedPlan || availablePlans?.size === 0}
        onClick={handleContinue}
        className="mt-4 w-full h-12 rounded-button bg-nmood-gradient text-primary-foreground font-semibold text-[15px] shadow-card hover:shadow-elevated disabled:opacity-60 flex items-center justify-center gap-2"
      >
        <Crown className="w-4 h-4" />
        {isPremium
          ? t('membership.you_are_premium')
          : busy
            ? t('membership.processing')
            : selectedPlan
              ? `${t('membership.continue_cta')} · ${getPlanPrice(selectedPlan)}`
              : 'Premium plans unavailable'}
      </motion.button>

      <p className="text-center text-[11px] text-muted-foreground mt-2.5">{t('membership.subscriptions_billed')}</p>

      {/* Restore Purchases & Manage Subscription — required for App Store approval */}
      <div className="flex items-center justify-center gap-4 mt-3">
        <button
          type="button"
          onClick={handleRestore}
          disabled={restoring}
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          {restoring ? t('membership.processing') : t('membership.restore_purchases')}
        </button>
        {isPremium && (
          <button
            type="button"
            onClick={() => cancel(billingPlatform)}
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            {t('membership.manage_subscription')}
          </button>
        )}
      </div>
      <WebPurchasePrompt open={webPurchasePromptOpen} onOpenChange={setWebPurchasePromptOpen} />
    </div>
  );
}

