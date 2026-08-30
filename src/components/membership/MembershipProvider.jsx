import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
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
import { showSubscriptionToast, SUBSCRIPTION_EVENTS } from '@/lib/subscription-notifications';
import {
  initializeMembership,
  purchaseMembership,
  restoreMembership,
  refreshMembership,
  openManageMembership,
} from '@/lib/membership-revenuecat';

const MembershipContext = createContext(null);

export function MembershipProvider({ children }) {
  const { user } = useAuth();
  const [membership, setMembership] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState(null);
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [purchaseError, setPurchaseError] = useState(null);
  const didSyncRef = useRef(false);

  useEffect(() => {
    let active = true;
    if (!user?.id) {
      setMembership(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    // Initialize RevenueCat with Supabase user ID and fetch membership.
    initializeMembership(user.id)
      .then((m) => {
        if (active) {
          setMembership(m);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Membership initialization failed:', err);
        if (active) {
          // Fail gracefully with Explorer membership
          setMembership({
            id: `explorer-${user.id}`,
            user_id: user.id,
            type: 'explorer',
            status: 'active',
          });
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [user?.id]);

  const refresh = useCallback(async () => {
    if (!user?.id) return;
    const m = await refreshMembership(user.id);
    if (m) setMembership(m);
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

  // MP-005: purchase through RevenueCat native store + real App Store receipt.
  // `rcPackage` is the package object from the live `default` offering; the SDK
  // purchases packages, so no plan-id/product-id remapping happens here.
  const purchase = useCallback(
    async (rcPackage) => {
      if (!user?.id) return null;

      const res = await purchaseMembership(user.id, rcPackage);

      if (!res.ok) {
        // A cancelled Apple sheet is a normal outcome, not a failure.
        if (res.cancelled) {
          setPurchaseError(null);
          return null;
        }
        const detail = { message: res.error || 'The purchase could not be completed.', code: res.code || 'UNKNOWN' };
        setPurchaseError(detail);
        trackMembershipEvent(MEMBERSHIP_EVENTS.PURCHASE_FAILED, detail);
        return null;
      }

      setPurchaseError(null);
      setMembership(res.membership);
      haptic('success');
      trackMembershipEvent(MEMBERSHIP_EVENTS.PURCHASED, { package: rcPackage?.identifier });
      trackProductEvent(PRODUCT_EVENTS.SUBSCRIPTION_STARTED, { package: rcPackage?.identifier });

      // Show welcome screen for first purchase, renewal toast only for a genuine renewal.
      const wasPremium = membership?.type === 'premium';
      if (!wasPremium && res.membership?.type === 'premium') {
        showWelcome();
      } else {
        showSubscriptionToast(SUBSCRIPTION_EVENTS.RENEWED, { dedupe: false });
      }

      return res.membership;
    },
    [user?.id, membership?.type, showWelcome]
  );

  // MP-005: restore prior store purchases through RevenueCat (cross-device, no duplicates).
  const restore = useCallback(
    async () => {
      if (!user?.id) return null;
      
      const res = await restoreMembership(user.id);
      if (res.membership) setMembership(res.membership);
      haptic(res.ok ? 'success' : 'selection');
      trackMembershipEvent(MEMBERSHIP_EVENTS.RESTORED, { active: res.ok });
      
      if (res.ok) {
        showSubscriptionToast(SUBSCRIPTION_EVENTS.RESTORED, { dedupe: false });
      } else {
        showSubscriptionToast(SUBSCRIPTION_EVENTS.NO_SUBSCRIPTION, { dedupe: false });
      }
      return res.membership;
    },
    [user?.id]
  );

  // MP-005: cancellations are managed by Apple/Google; open native settings.
  const cancel = useCallback(
    async () => {
      await openManageMembership();
      showSubscriptionToast(SUBSCRIPTION_EVENTS.CANCEL_INFO, { dedupe: false });
      trackMembershipEvent(MEMBERSHIP_EVENTS.CANCELLED);
      return membership;
    },
    [membership]
  );

  // MP-005: silent background refresh on login/launch — fetch latest entitlement from RevenueCat.
  const sync = useCallback(async () => {
    if (!user?.id) return null;
    const m = await refreshMembership(user.id);
    if (m) setMembership(m);
    return m;
  }, [user?.id]);

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
    purchaseError,
    clearPurchaseError: () => setPurchaseError(null),
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