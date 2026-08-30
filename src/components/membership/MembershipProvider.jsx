import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  ensureMembership,
  persistUsage,
  effectiveType,
  getCurrentPlan,
  getStatus,
  isActive,
  isTrial,
  isGracePeriod,
  isExpired,
  isCancelled,
  daysRemaining,
  getBillingPlatform,
} from '@/lib/membership-engine';
import { requestPermission, hasPermission, remainingLimit } from '@/lib/permission-engine';
import { trackMembershipEvent, MEMBERSHIP_EVENTS, trackPremiumFeature } from '@/lib/membership-analytics';
import { haptic } from '@/lib/haptics';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { trackProductEvent, PRODUCT_EVENTS } from '@/lib/product-analytics';
import { useAuth } from '@/lib/AuthContext';
import UpgradeDialog from '@/components/membership/UpgradeDialog';
import WelcomeToPremium from '@/components/membership/WelcomeToPremium';
import {
  subscriptionPurchase,
  subscriptionRestore,
  subscriptionSync,
  manageSubscription,
  emitMembershipChanged,
} from '@/lib/subscription-service';
import { showSubscriptionToast, SUBSCRIPTION_EVENTS } from '@/lib/subscription-notifications';

const MembershipContext = createContext(null);

export function MembershipProvider({ children }) {
  const { user } = useAuth();
  const [membership, setMembership] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState(null);
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const didSyncRef = useRef(false);

  useEffect(() => {
    let active = true;
    if (!user?.id) {
      setMembership(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    ensureMembership(user).then((m) => {
      if (active) {
        setMembership(m);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [user?.id]);

  const refresh = useCallback(async () => {
    if (!user?.id) return;
    const m = await ensureMembership(user);
    setMembership(m);
  }, [user?.id]);

  const type = effectiveType(membership);
  const isPremium = type === 'premium';

  const check = useCallback(
    (feature, context) => requestPermission(feature, membership, context),
    [membership]
  );
  const can = useCallback((feature, context) => check(feature, context).allowed, [check]);

  const showUpgrade = useCallback((reason) => {
    // Premium users never see upgrade prompts — prevents the contradictory
    // "Premium ACTIVE" + "Upgrade to Premium" state across surfaces.
    if (isPremium) return;
    setUpgradeReason(reason || 'manual');
    setUpgradeOpen(true);
    haptic('selection');
    trackMembershipEvent(MEMBERSHIP_EVENTS.UPGRADE_CLICKED, { reason: reason || 'manual' });
    trackProductEvent(PRODUCT_EVENTS.UPGRADE_CLICKED, { feature: reason || 'manual' });
    // MP-006: record the first time an Explorer is prompted to upgrade (once per device).
    if (membership?.type === 'explorer') {
      try {
        if (!localStorage.getItem('nmood:first-premium-prompt')) {
          localStorage.setItem('nmood:first-premium-prompt', Date.now().toString());
          trackProductEvent(PRODUCT_EVENTS.FIRST_PREMIUM_PROMPT, { source: reason || 'manual' });
        }
      } catch { /* storage may be unavailable */ }
    }
  }, [isPremium, membership?.type]);

  const recordUsage = useCallback(
    async (action) => {
      if (!membership?.id) return membership;
      const updated = await persistUsage(membership, action);
      setMembership(updated);
      // MP-006: anonymously track premium feature adoption (count + first/last, no content).
      if (membership.type === 'premium') {
        const featureMap = {
          join_circle: 'unlimited_circles',
          join_experience: 'unlimited_experiences',
          connection_request: 'private_messaging',
        };
        if (featureMap[action]) trackPremiumFeature(featureMap[action]);
      }
      return updated;
    },
    [membership]
  );

  const showWelcome = useCallback(() => {
    setWelcomeOpen(true);
    haptic('success');
  }, []);

  // MP-005: purchase through the native store + server-side receipt validation.
  const purchase = useCallback(
    async (planId, provider) => {
      const res = await subscriptionPurchase({ user, planId, provider });
      if (!res.ok) {
        if (res.toastEvent) showSubscriptionToast(res.toastEvent, { dedupe: false });
        return null;
      }
      setMembership(res.membership);
      haptic('success');
      trackMembershipEvent(MEMBERSHIP_EVENTS.PURCHASED, { planId, provider: res.provider });
      trackProductEvent(PRODUCT_EVENTS.SUBSCRIPTION_STARTED, { plan: planId, provider: res.provider });
      emitMembershipChanged({ type: 'premium', event: res.event });
      if (res.event === 'purchased') showWelcome();
      else { showSubscriptionToast(SUBSCRIPTION_EVENTS.RENEWED, { dedupe: false }); trackProductEvent(PRODUCT_EVENTS.SUBSCRIPTION_RENEWED, { plan: planId, provider: res.provider }); }
      return res.membership;
    },
    [user, showWelcome]
  );

  // MP-005: restore prior store purchases (cross-device, no duplicates, no ticket).
  const restore = useCallback(
    async (provider) => {
      const res = await subscriptionRestore({ user, provider });
      if (res.membership) setMembership(res.membership);
      haptic(res.ok ? 'success' : 'selection');
      trackMembershipEvent(MEMBERSHIP_EVENTS.RESTORED, { provider: res.provider, active: res.ok });
      if (res.ok) {
        emitMembershipChanged({ type: 'premium', event: 'restored' });
        showSubscriptionToast(SUBSCRIPTION_EVENTS.RESTORED, { dedupe: false });
      } else {
        showSubscriptionToast(res.toastEvent || SUBSCRIPTION_EVENTS.NO_SUBSCRIPTION, { dedupe: false });
      }
      return res.membership;
    },
    [user]
  );

  // MP-005: cancellations are managed by the store; open native settings, never downgrade locally.
  const cancel = useCallback(
    async (provider) => {
      const prov = provider || membership?.billing_platform;
      manageSubscription(prov);
      showSubscriptionToast(SUBSCRIPTION_EVENTS.CANCEL_INFO, { dedupe: false });
      trackMembershipEvent(MEMBERSHIP_EVENTS.CANCELLED, { provider: prov });
      return membership;
    },
    [membership]
  );

  // MP-005: silent background sync on login/launch — reconcile entitlement, surface grace/expiry.
  const sync = useCallback(async () => {
    if (!user?.id || !membership?.id) return null;
    const prevStatus = membership.status;
    const prevType = membership.type;
    const res = await subscriptionSync({ user, provider: membership.billing_platform }).catch(() => null);
    if (res?.membership) {
      setMembership((cur) => (cur && res.membership.id === cur.id ? res.membership : cur));
      if (res.membership.status !== prevStatus) {
        if (res.membership.status === 'grace_period' && prevStatus !== 'grace_period') {
          showSubscriptionToast(SUBSCRIPTION_EVENTS.GRACE_STARTED, { dedupe: true, dedupeKey: 'grace' });
          trackProductEvent(PRODUCT_EVENTS.SUBSCRIPTION_GRACE_ENTERED, { plan: res.membership.plan });
        } else if (res.membership.status === 'expired' && prevType === 'premium') {
          showSubscriptionToast(SUBSCRIPTION_EVENTS.EXPIRED, { dedupe: true, dedupeKey: 'expired' });
          trackProductEvent(PRODUCT_EVENTS.SUBSCRIPTION_EXPIRED, { plan: res.membership.plan });
        } else if (['active', 'trial'].includes(res.membership.status) && ['grace_period', 'expired', 'cancelled'].includes(prevStatus)) {
          trackProductEvent(PRODUCT_EVENTS.SUBSCRIPTION_RECOVERED, { plan: res.membership.plan });
          trackMembershipEvent(MEMBERSHIP_EVENTS.RECOVERED, { plan: res.membership.plan });
        }
      }
      if (res.event === 'renewed') trackProductEvent(PRODUCT_EVENTS.SUBSCRIPTION_RENEWED, { plan: res.membership.plan, provider: res.membership.billing_platform });
      emitMembershipChanged({ type: res.membership.type });
    }
    return res?.membership || null;
  }, [user?.id, membership?.id, membership?.status, membership?.type, membership?.billing_platform]);

  useEffect(() => {
    if (didSyncRef.current || !membership?.id || !user?.id) return;
    didSyncRef.current = true;
    sync();
  }, [membership?.id, user?.id]);

  // Re-sync entitlement whenever the app returns to the foreground — covers
  // returning from Manage Membership (Apple/Google subscription settings) or
  // the App Store purchase sheet, and lets a granted/admin membership take
  // effect immediately without requiring a manual app restart.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return undefined;
    const listenerPromise = CapacitorApp.addListener('appStateChange', ({ isActive: active }) => {
      if (active) sync();
    });
    return () => { listenerPromise.then((l) => l.remove()); };
  }, [sync]);

  // --- MP-001 helper API (read from cached membership state, no extra queries) ---
  const currentPlan = getCurrentPlan(membership);
  const membershipStatus = getStatus(membership);
  const remainingDays = daysRemaining(membership);
  const billingPlatform = getBillingPlatform(membership);

  const value = {
    membership,
    type,
    isPremium,
    loading,
    check,
    can,
    hasPermission: (feature, context) => hasPermission(feature, membership, context),
    remainingLimits: (feature) => remainingLimit(feature, membership),
    currentPlan,
    membershipStatus,
    remainingDays,
    billingPlatform,
    isActive: () => isActive(membership),
    isTrial: () => isTrial(membership),
    isGracePeriod: () => isGracePeriod(membership),
    isExpired: () => isExpired(membership),
    isCancelled: () => isCancelled(membership),
    showUpgrade,
    recordUsage,
    refresh,
    purchase,
    restore,
    cancel,
    sync,
    welcomeOpen,
    setWelcomeOpen,
    upgradeOpen,
    setUpgradeOpen,
    upgradeReason,
  };

  return (
    <MembershipContext.Provider value={value}>
      {children}
      <UpgradeDialog />
      <WelcomeToPremium />
    </MembershipContext.Provider>
  );
}

export function useMembershipAccess() {
  const ctx = useContext(MembershipContext);
  if (!ctx) throw new Error('useMembershipAccess must be used within MembershipProvider');
  return ctx;
}