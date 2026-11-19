import CurrentStoreSubscription from '@/components/membership/CurrentStoreSubscription';
import { useStoreSubscription } from '@/lib/use-store-subscription';
import { subscriptionName } from '@/lib/subscription-display';
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Check, Crown } from 'lucide-react';
import { useMembershipAccess } from '@/components/membership/MembershipProvider';
import { trackMembershipEvent } from '@/lib/membership-analytics';
import { trackProductEvent, PRODUCT_EVENTS } from '@/lib/product-analytics';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { RotateCcw, Settings } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import WebPurchasePrompt from '@/components/membership/WebPurchasePrompt';
import { planDuration } from '@/lib/membership-presentation';
import { withTimeout } from '@/lib/bounded-operation';
import { getAvailableProducts } from '@/lib/revenuecat-client';

// UI-023 — Beautiful pricing cards with selection-lift animation.
// Preserves the exact purchase flow from PremiumPlanSelector (onPurchase hook).
const BADGE_TONE = {
  best_value: 'bg-nmood-gradient text-primary-foreground',
  most_flexible: 'bg-info/15 text-info border border-info/30',
  try_premium: 'bg-accent/40 text-accent-foreground border border-accent/50',
};

function NativePremiumPlans() {
  const { t } = useLocalization();
  const { isPremium, loading: membershipLoading, initializingStore = false, entitlementState, purchase, restore, cancel, billingPlatform, purchaseError, clearPurchaseError, sync } = useMembershipAccess();
  // The verified Explorer server projection is sufficient to show the upgrade
  // page. Do not hide it behind a delayed native billing initialization.
  const membershipPending = membershipLoading && entitlementState !== 'explorer';
  const store = useStoreSubscription(membershipPending || (initializingStore && entitlementState !== 'explorer'));
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreResult, setRestoreResult] = useState(null);
  const [webPurchasePromptOpen, setWebPurchasePromptOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productRetry, setProductRetry] = useState(0);
  const setupRequestedRef = useRef(false);
  const isNativeStore = Capacitor.isNativePlatform();

  // Products come only from the live RevenueCat `default` offering. There is no
  // hardcoded price fallback — showing a price we cannot actually charge is what
  // let an unpurchasable plan be selected.
  useEffect(() => {
    if (membershipPending || (initializingStore && entitlementState !== 'explorer')) return undefined;
    let active = true;
    setLoadingProducts(true);
    // Reconcile the store once in the background, but never make the plan UI
    // wait indefinitely for that operation. A successful setup triggers one
    // automatic product retry; further retries are explicit user actions.
    if (!setupRequestedRef.current) {
      setupRequestedRef.current = true;
      Promise.resolve(sync?.()).finally(() => {
        if (active) setProductRetry(value => value + 1);
      });
    }
    withTimeout(() => getAvailableProducts({ fresh: true }))
      .then((prods) => {
        if (!active) return;
        setProducts(prods || []);
        if (prods && prods.length > 0) setSelected(prods[0].id);
        setLoadError(null);
      })
      .catch((err) => {
        if (!active) return;
        setProducts([]);
        setLoadError({ message: err?.message || 'Plans could not be loaded.', code: err?.code || 'FETCH_FAILED' });
      })
      .finally(() => { if (active) setLoadingProducts(false); });
    return () => {
      active = false;
    };
  }, [membershipPending, initializingStore, entitlementState, sync, productRetry]);

  const premiumPlans = products;
  const selectedProduct = premiumPlans.find((p) => p.id === selected) || premiumPlans[0] || null;
  const getPlanPrice = (p) => p?.localizedPrice || '';
  const getPlanSavings = () => 0;

  const handleRestore = async () => {
    if (restoring) return;
    setRestoring(true);
    setRestoreResult(null);
    try {
      const result = await restore();
      setRestoreResult({
        success: Boolean(result),
        message: result ? 'Purchases restored successfully.' : 'Membership could not be confirmed. Please retry verification.',
      });
    } catch (error) {
      setRestoreResult({ success: false, message: error?.message || 'Could not restore purchases. Please try again.' });
    } finally {
      await store.refresh();
      setRestoring(false);
    }
  };

  const handleSelect = (productId) => {
    if (productId === selected) return;
    setSelected(productId);
    clearPurchaseError?.();
    trackMembershipEvent('Plan Selected', { plan: productId });
  };

  const handleContinue = async () => {
    if (isPremium || store.loading || store.error || store.info?.hasActiveSubscription || busy) return;
    if (!selectedProduct) return;
    if (!isNativeStore) {
      trackMembershipEvent('Continue Pressed', { plan: selected, channel: 'web' });
      trackProductEvent(PRODUCT_EVENTS.UPGRADE_CLICKED, { plan: selected, channel: 'web' });
      setWebPurchasePromptOpen(true);
      return;
    }
    setBusy(true);
    clearPurchaseError?.();
    trackMembershipEvent('Continue Pressed', { plan: selected });
    trackMembershipEvent('Purchase Started', { plan: selected });
    trackProductEvent(PRODUCT_EVENTS.UPGRADE_CLICKED, { plan: selected });
    try {
      // This exact RevenueCat package call opens Apple's purchase confirmation UI.
      // Apple decides whether approval uses Face ID, Touch ID, or passcode.
      const result = await purchase(selectedProduct.rcPackage);
      if (result) trackMembershipEvent('Purchase Completed', { plan: selected });
    } catch { /* purchaseError carries the reason */ } finally {
      await store.refresh();
      setBusy(false);
    }
  };

  const failure = purchaseError || loadError;

  return (
    <div>
      <div className="px-1 mb-4">
        <h2 className="font-heading text-xl font-bold tracking-tight">{t('membership.premium.plans_title')}</h2>
        <p className="text-[13px] text-muted-foreground mt-0.5">{t('membership.premium.plans_subtitle')}</p>
      </div>

      <CurrentStoreSubscription info={store.info} products={products}/>
      {store.error && <div role="status"><p>Subscription status could not be refreshed. Retry before purchasing.</p><button type="button" className="min-h-11 px-4" onClick={store.refresh}>Retry subscription check</button></div>}
      {store.loading && <p role="status">Checking current subscription…</p>}
      {!store.loading && !store.error && !store.info?.hasActiveSubscription && <div className="grid grid-cols-2 gap-3">
        {premiumPlans.map((p) => {
          const active = selected === p.id;
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

              <p className="font-heading text-[17px] font-bold leading-tight">{subscriptionName(p)}</p>
              <p className="text-[15px] font-bold mt-0.5">{getPlanPrice(p)}</p>
              {planDuration(p.period) && (
                <p className="text-[11.5px] text-muted-foreground mt-0.5">
                  {planDuration(p.period)}
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
      </div>}

      {!store.info?.hasActiveSubscription && <motion.button
        type="button"
        whileTap={{ scale: 0.98 }}
        disabled={isPremium || store.loading || store.error || busy || !selectedProduct}
        onClick={handleContinue}
        className="mt-4 w-full h-12 rounded-button bg-nmood-gradient text-primary-foreground font-semibold text-[15px] shadow-card hover:shadow-elevated disabled:opacity-60 flex items-center justify-center gap-2"
      >
        <Crown className="w-4 h-4" />
        {isPremium
          ? t('membership.you_are_premium')
          : busy
            ? t('membership.processing')
            : selectedProduct
              ? `${t('membership.continue_cta')} · ${getPlanPrice(selectedProduct)}`
              : loadingProducts
                ? t('common.loading')
                : 'Premium plans unavailable'}
      </motion.button>}

      {failure && failure.code !== 'CURRENT_SUBSCRIPTION' && !store.info?.hasActiveSubscription && (
        <div role="alert" data-testid="purchase-error" className="mt-3 rounded-card border border-destructive/30 bg-destructive/5 p-3">
          <p className="text-[13px] font-semibold text-destructive">{t('membership.purchase_failed_title')}</p>
          <p className="mt-0.5 text-[12px] text-muted-foreground">{failure.message}</p>
          <p className="mt-1 text-[11px] text-muted-foreground/80">{t('membership.purchase_error_code', { code: failure.code })}</p>
          <button type="button" className="mt-3 min-h-10 rounded-input border px-3 text-xs font-semibold" onClick={() => setProductRetry(value => value + 1)}>Retry plans</button>
        </div>
      )}

      <p className="text-center text-[11px] text-muted-foreground mt-2.5">{t('membership.subscriptions_billed')}</p>

      {/* Restore Purchases & Manage Subscription — required for App Store approval */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
        <button
          type="button"
          onClick={handleRestore}
          disabled={restoring}
          className="min-h-11 w-full inline-flex items-center justify-center gap-2 rounded-input px-3 text-center text-[12px] leading-tight font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
        >
          <RotateCcw className="w-4 h-4 shrink-0" />
          {restoring ? t('membership.processing') : t('membership.restore_purchases')}
        </button>
        {isPremium && !store.info?.hasActiveSubscription && (
          <button
            type="button"
            onClick={() => cancel(billingPlatform)}
            className="min-h-11 w-full inline-flex items-center justify-center gap-2 rounded-input px-3 text-center text-[12px] leading-tight font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Settings className="w-4 h-4 shrink-0" />
            {t('membership.premium.manage_subscription')}
          </button>
        )}
      </div>
      {restoreResult && (
        <p role="status" className={`mt-2 text-center text-xs ${restoreResult.success ? 'text-success' : 'text-destructive'}`}>
          {restoreResult.message}
        </p>
      )}
      <WebPurchasePrompt open={webPurchasePromptOpen} onOpenChange={setWebPurchasePromptOpen} />
    </div>
  );
}

function WebPremiumPlans() {
  const { isPremium, loading, refreshing, entitlementState, refresh } = useMembershipAccess();
  const [open, setOpen] = useState(false);
  if (loading) return <p role="status">Checking membership…</p>;
  return <section className="space-y-3 rounded-card border bg-card p-4">
    <h2 className="font-heading text-xl font-bold">{isPremium ? 'Your Premium membership' : 'Nmood Premium'}</h2>
    {entitlementState === 'unavailable' ? <p role="status">Membership could not be verified. Please retry.</p> :
      <p className="text-sm">{isPremium ? 'Your account has Premium access.' : 'Purchase Premium in the Nmood mobile app. Your verified membership is available here when you sign in with the same account.'}</p>}
    <button type="button" disabled={refreshing} className="min-h-11 rounded-button border px-4" onClick={() => refresh({ verifyPurchases: false })}>{refreshing ? 'Checking membership…' : 'Refresh membership'}</button>
    {!isPremium && entitlementState === 'explorer' && <button type="button" className="min-h-11 w-full rounded-button bg-primary px-4 text-primary-foreground" onClick={() => setOpen(true)}>Continue in the Nmood app</button>}
    <WebPurchasePrompt open={open} onOpenChange={setOpen}/>
  </section>;
}
export default function PremiumPlans() {
  return Capacitor.isNativePlatform() ? <NativePremiumPlans/> : <WebPremiumPlans/>;
}
