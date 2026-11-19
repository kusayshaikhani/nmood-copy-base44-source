import { hasVerifiedSubscriptionPremium } from '@/lib/subscription-premium-display';
import { signalPassportSubscriptionChange } from '@/lib/passport-provider-adapter';
import { watchMembershipProjection } from '@/lib/membership-realtime';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { fetchExplorerPolicy, parseExplorerPolicy, useExplorerPolicy } from '@/lib/explorer-policy';
import { clearRevenueCatCache, watchSubscriptionChanges } from '@/lib/revenuecat-client';
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
import { requestPermission, remainingLimit } from '@/lib/permission-engine';
import { trackMembershipEvent, MEMBERSHIP_EVENTS, trackPremiumFeature } from '@/lib/membership-analytics';
import { haptic } from '@/lib/haptics';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { trackProductEvent, PRODUCT_EVENTS } from '@/lib/product-analytics';
import { useAuth } from '@/lib/AuthContext';
import WelcomeToPremium from '@/components/membership/WelcomeToPremium';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Crown } from 'lucide-react';
import { showSubscriptionToast, SUBSCRIPTION_EVENTS } from '@/lib/subscription-notifications';
import { withTimeout } from '@/lib/bounded-operation';
import {
  initializeMembership,
  purchaseMembership,
  restoreMembership,
  refreshMembership,
  reconcileWebMembership,
  openManageMembership,
} from '@/lib/membership-revenuecat';

const MembershipContext = createContext(null);
export const EXPLORER_UPGRADE_NUDGE_INTERVAL_MS = 3 * 60 * 1000;

export function shouldShowExplorerUpgradeNudge({ user, type, isPremium, administratorAccess, entitlementState, platform, pathname } = {}) {
  return Boolean(user?.id)
    && platform !== 'ios'
    && type === 'explorer'
    && !isPremium
    && !administratorAccess
    && entitlementState === 'explorer'
    && !['/upgrade', '/membership'].includes(pathname);
}

function ExplorerUpgradeNudge({ eligible, onUpgrade }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!eligible) {
      setOpen(false);
      return undefined;
    }
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') setOpen(true);
    }, EXPLORER_UPGRADE_NUDGE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [eligible]);

  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogContent className="w-[calc(100%-2rem)] max-w-sm rounded-3xl p-6">
      <DialogHeader className="items-center text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Crown className="h-6 w-6" /></span>
        <DialogTitle>Make more of Nmood</DialogTitle>
        <DialogDescription>Premium gives you more ways to discover, connect, and take part in the moments that matter to you.</DialogDescription>
      </DialogHeader>
      <button type="button" className="min-h-12 w-full rounded-button bg-nmood-gradient px-4 text-sm font-semibold text-primary-foreground" onClick={() => { setOpen(false); onUpgrade(); }}>Upgrade to Premium Now</button>
      <button type="button" className="min-h-11 w-full text-sm font-medium text-muted-foreground" onClick={() => setOpen(false)}>Not now</button>
    </DialogContent>
  </Dialog>;
}

export function MembershipProvider({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  const policyQuery = useExplorerPolicy({ manageRefresh: true });
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [cachedMembership, setMembership] = useState(null);
  // Display and permission checks share the same server projection cache.
  const projection = policyQuery.data;
  const membership = projection ? {
    ...cachedMembership, ...projection.membership, user_id: user?.id,
    type: projection.premium ? 'premium' : 'explorer',
    status: projection.administratorAccess ? 'active' : projection.premium ? (projection.membership?.status || 'active') : 'explorer',
    ...(projection.administratorAccess ? { expires_at: null, renewal_date: null, expirationDate: null, expiresDate: null } : {}),
    _server_authorized: true,
  } : cachedMembership?.user_id === user?.id ? cachedMembership : null;
  const publishProjection = useCallback(server => {
    if (currentUserRef.current !== user?.id) return;
    const key = ['explorerPolicy', user?.id];
    const previous = queryClient.getQueryData(key);
    const next = parseExplorerPolicy(server);
    queryClient.setQueryData(key, next);
    signalPassportSubscriptionChange();
    if (previous?.premium !== next.premium || previous?.administratorAccess !== next.administratorAccess || previous?.subscriptionPremium !== next.subscriptionPremium) {
      window.dispatchEvent(new Event('nmood:access-changed'));
      void queryClient.invalidateQueries({ queryKey: ['memberProfile'] });
      void queryClient.invalidateQueries({ queryKey: ['discovery'] });
    }
  }, [queryClient, user?.id]);
  const currentUserRef = useRef(user?.id);
  currentUserRef.current = user?.id;
  const [loading, setLoading] = useState(true);
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [purchaseError, setPurchaseError] = useState(null);
  const operationRef = useRef(0);
  const recoveryRef = useRef(null);
  const refreshRef = useRef(null);
  const [refreshing, setRefreshing] = useState(false);
  const purchaseInFlightRef = useRef(false);
  const restoreInFlightRef = useRef(false);

  useEffect(() => {
    let active = true;
    const operation = ++operationRef.current;
    const controller = new AbortController();
    recoveryRef.current?.abort();
    recoveryRef.current = controller;
    refreshRef.current = null;
    setRefreshing(false);
    clearRevenueCatCache();
    setMembership(null);
    if (!user?.id) {
      setMembership(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    // Initialize RevenueCat with Supabase user ID and fetch membership.
    // Native billing must never keep the whole app in a permanent "checking"
    // state. The server policy independently confirms Explorer or Premium
    // access, while a slow store bridge can complete/retry in the background.
    withTimeout(
      () => (Capacitor.isNativePlatform() ? initializeMembership : reconcileWebMembership)(user.id, { signal: controller.signal, onServerStatus: publishProjection }),
      20000
    )
      .then((m) => {
        if (active && currentUserRef.current === user.id) {
          setMembership(m);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Membership initialization failed:', err);
        if (active && currentUserRef.current === user.id) {
          // Keep access limited and expose a terminal retry state on failure.
          setMembership({ id: 'explorer-' + user.id, user_id: user.id, type: 'explorer', status: 'unavailable', active: false, _server_authorized: false });
          setLoading(false);
        }
      });
    return () => {
      active = false;
      controller.abort();
      recoveryRef.current?.abort();
      clearRevenueCatCache();
    };
  }, [user?.id, publishProjection]);

  const refresh = useCallback(({ verifyPurchases = true } = {}) => {
    if (!user?.id) return Promise.resolve(null);
    if (refreshRef.current?.userId === user.id) return refreshRef.current.promise;
    const operation = ++operationRef.current;
    recoveryRef.current?.abort();
    const controller = new AbortController();
    recoveryRef.current = controller;
    setRefreshing(true);
    const entry = { userId: user.id };
    entry.promise = (async () => {
      try {
        const m = await (Capacitor.isNativePlatform() ? refreshMembership : reconcileWebMembership)(user.id, { signal: controller.signal, onServerStatus: publishProjection, verifyPurchases });
        if (m && currentUserRef.current === user.id && operation === operationRef.current) setMembership(previous => m._server_authorized === false && previous?._server_authorized ? { ...previous, _reconciliation_status: 'unavailable' } : m);
        return m;
      } catch {
        if (currentUserRef.current === user.id && operation === operationRef.current) setMembership(previous => previous?._server_authorized ? { ...previous, _reconciliation_status: 'unavailable' } : { user_id: user.id, type: 'explorer', status: 'unavailable', _server_authorized: false });
        return null;
      } finally {
        if (refreshRef.current === entry) refreshRef.current = null;
        if (currentUserRef.current === user.id && operation === operationRef.current) {
          setRefreshing(false);
          setLoading(false);
        }
      }
    })();
    refreshRef.current = entry;
    return entry.promise;
  }, [user?.id, publishProjection]);

  const { refetch: refreshPolicy } = policyQuery;


  const unresolved = !projection || projection.verification_pending === true;
  // A server-confirmed Explorer is safe to render immediately. RevenueCat is
  // still allowed to reconcile in the background, but a delayed store SDK
  // cannot hide the account behind a never-ending loading screen.
  const confirmedExplorer = projection?.premium === false
    && projection?.verification_pending !== true
    && projection?.role_verification_pending !== true;
  const verifying = (!projection?.premium && !confirmedExplorer && (loading || refreshing || policyQuery.isFetching))
    || (projection?.role_verification_pending === true && !policyQuery.isError);
  const type = verifying || unresolved && !projection?.premium ? 'unknown' : effectiveType(membership);
  const isPremium = type === 'premium';

  const check = useCallback(
    (feature, context) => verifying || type === 'unknown' ? { allowed: false, reason: 'verification_pending', feature } : requestPermission(feature, { ...membership, explorer_policy: policyQuery.data, type: policyQuery.data?.premium === true ? 'premium' : 'explorer' }, context),
    [membership, verifying, type, policyQuery.data]
  );
  const can = useCallback((feature, context) => check(feature, context).allowed, [check]);

  // Callers invoke this from an explicit user action. Never open a modal
  // automatically when entitlement loading or a route check completes.
  const showUpgrade = useCallback((reason) => {
    if (verifying || type === 'unknown' || projection?.role_verification_pending) return;
    navigate(isPremium ? '/membership' : '/upgrade');
    trackMembershipEvent(MEMBERSHIP_EVENTS.UPGRADE_CLICKED, { reason: reason || 'manual' });
  }, [isPremium, verifying, type, navigate, projection?.role_verification_pending]);

  const recordUsage = useCallback(
    async (action) => {
      if (!membership?.id) return membership;
      const updated = await persistUsage(membership, action);
      if (updated?.user_id === currentUserRef.current) setMembership(updated);
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
      if (!user?.id || purchaseInFlightRef.current) return null;
      purchaseInFlightRef.current = true;

      let res;
      try {
        const currentAccess = await fetchExplorerPolicy({ expectedUserId: user.id });
        queryClient.setQueryData(['explorerPolicy', user.id], currentAccess);
        if (currentAccess.administratorAccess) return null;
        setRefreshing(true);
        res = await purchaseMembership(user.id, rcPackage, { onServerStatus: publishProjection });
      } finally {
        purchaseInFlightRef.current = false;
        if (currentUserRef.current === user.id) setRefreshing(false);
      }

      if (currentUserRef.current !== user.id) return null;
      if (res?.membership) setMembership(res.membership);
      if (!res.ok) {
        const detail = {
          message: res.error || (
            res.pending
              ? 'Your purchase is still pending approval in the App Store.'
              : res.cancelled
                ? 'Purchase cancelled. No charge was made.'
                : 'The purchase could not be completed.'
          ),
          code: res.code || 'UNKNOWN',
        };

        setPurchaseError(detail);
        if (res.pending || res.cancelled) {
          trackMembershipEvent(MEMBERSHIP_EVENTS.PURCHASE_FAILED, detail);
        } else {
          trackMembershipEvent(MEMBERSHIP_EVENTS.PURCHASE_FAILED, detail);
        }
        return null;
      }

      if (currentUserRef.current !== user.id) return null;
      setPurchaseError(null);
      setMembership(res.membership);
      void refreshPolicy();
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
    [user?.id, membership?.type, showWelcome, refreshPolicy, queryClient, publishProjection]
  );

  // MP-005: restore prior store purchases through RevenueCat (cross-device, no duplicates).
  const restore = useCallback(
    async () => {
      if (!user?.id || restoreInFlightRef.current) return null;
      restoreInFlightRef.current = true;
      let res;
      try {
        setRefreshing(true);
        res = await restoreMembership(user.id, { onServerStatus: publishProjection });
      } finally {
        restoreInFlightRef.current = false;
        if (currentUserRef.current === user.id) setRefreshing(false);
      }
      if (currentUserRef.current !== user.id) return null;
      if (res.membership) setMembership(res.membership);
      void refreshPolicy();
      haptic(res.ok ? 'success' : 'selection');
      trackMembershipEvent(MEMBERSHIP_EVENTS.RESTORED, { active: res.ok });
      
      if (res.ok) {
        showSubscriptionToast(SUBSCRIPTION_EVENTS.RESTORED, { dedupe: false });
      } else {
        showSubscriptionToast(res.membership?._reconciliation_status === 'confirmed'
          ? SUBSCRIPTION_EVENTS.NO_SUBSCRIPTION
          : SUBSCRIPTION_EVENTS.VERIFICATION_PENDING, { dedupe: false });
      }
      return res.membership;
    },
    [user?.id, refreshPolicy, publishProjection]
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
    setPurchaseError(null);
    return refresh();
  }, [refresh]);

  // Re-sync entitlement whenever the app returns to the foreground — covers
  // returning from Manage Membership (Apple/Google subscription settings) or
  // the App Store purchase sheet, and lets a granted/admin membership take
  // effect immediately without requiring a manual app restart.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return undefined;
    const listenerPromise = CapacitorApp.addListener('appStateChange', ({ isActive: active }) => {
      if (active && user?.id) { void refreshPolicy(); void sync(); }
    });
    return () => { listenerPromise.then((l) => l.remove()); };
  }, [sync, refreshPolicy, user?.id]);

  useEffect(() => {
    if (!user?.id) return undefined;
    const traced = (path, action) => window.NmoodRecovery ? window.NmoodRecovery.trace(path, action) : action();
    const stop = traced('MEM-STORE', () => watchSubscriptionChanges(() => { signalPassportSubscriptionChange(); void sync(); }));
    const stopProjection = traced('MEM-REALTIME', () => watchMembershipProjection(user.id, ({ revoked, roleChanged } = {}) => {
      signalPassportSubscriptionChange();
      if (roleChanged) {
        queryClient.setQueryData(['explorerPolicy', user.id], { premium: false, administratorAccess: false, verification_pending: true, role_verification_pending: true, discovery_locked: true, incoming_locked: true, membership: { status: 'unavailable' } });
        window.dispatchEvent(new Event('nmood:access-changed'));
        void queryClient.resetQueries({ queryKey: ['memberProfile'] });
        void queryClient.invalidateQueries({ queryKey: ['notifications'] });
      }
      if (revoked && !roleChanged) queryClient.setQueryData(['explorerPolicy', user.id], previous => previous && !previous.administratorAccess ? {
        ...previous, subscriptionPremium: false, premium: previous.administratorAccess === true,
        discovery_locked: previous.administratorAccess !== true, incoming_locked: previous.administratorAccess !== true, verification_pending: previous.administratorAccess !== true,
        membership: { ...previous.membership, status: 'expired' },
      } : previous);
      // Projection notifications are read-only invalidations, never another
      // provider verification/write (which would feed back into this listener).
      void refreshPolicy(); void refresh({ verifyPurchases: false });
      void queryClient.invalidateQueries({ queryKey: ['discovery'] });
      void queryClient.invalidateQueries({ queryKey: ['memberProfile'] });
    }));
    const changed = () => { void sync(); };
    const visible = () => { if (!document.hidden) { void refreshPolicy(); void sync(); } };
    window.addEventListener('nmood:subscription-changed', changed);
    window.addEventListener('nmood:refresh', changed);
    document.addEventListener('visibilitychange', visible);
    return () => { traced('MEM-STORE', stop); traced('MEM-REALTIME', stopProjection); window.removeEventListener('nmood:subscription-changed', changed); window.removeEventListener('nmood:refresh', changed); document.removeEventListener('visibilitychange', visible); };
  }, [user?.id, sync, refresh, refreshPolicy, queryClient]);

  useEffect(() => {
    const expiry = Date.parse(projection?.membership?.expires_at || '');
    if ((projection?.administratorAccess && !projection?.subscriptionPremium) || !projection?.premium || !Number.isFinite(expiry)) return undefined;
    const timer = setTimeout(() => {
      signalPassportSubscriptionChange();
      // Withdraw expired authorization immediately, even while offline. The
      // server still evaluates its own clock on every protected operation.
      queryClient.setQueryData(['explorerPolicy', user?.id], previous => previous ? {
        ...previous, subscriptionPremium: false, premium: previous.administratorAccess === true,
        discovery_locked: previous.administratorAccess !== true, incoming_locked: previous.administratorAccess !== true, verification_pending: previous.administratorAccess !== true,
        membership: { ...previous.membership, status: 'expired' },
      } : previous);
      void refreshPolicy(); void sync();
    }, Math.min(Math.max(0, expiry - Date.now()), 2147483647));
    // Long subscriptions re-arm at the timer maximum without early downgrade.
    if (expiry - Date.now() > 2147483647) {
      clearTimeout(timer);
      const next = setTimeout(() => { void refreshPolicy(); }, 2147483647);
      return () => clearTimeout(next);
    }
    return () => clearTimeout(timer);
  }, [projection, queryClient, user?.id, refreshPolicy, sync]);

  useEffect(() => {
    const reset = Date.parse(projection?.resets_at || '');
    if (projection?.premium || !Number.isFinite(reset) || reset <= Date.now()) return undefined;
    const timer = setTimeout(() => { void refreshPolicy(); }, Math.min(reset - Date.now() + 1, 2147483647));
    return () => clearTimeout(timer);
  }, [projection, refreshPolicy]);

  // --- MP-001 helper API (read from cached membership state, no extra queries) ---
  const currentPlan = getCurrentPlan(membership);
  const membershipStatus = getStatus(membership);
  const remainingDays = daysRemaining(membership);
  const billingPlatform = getBillingPlatform(membership);

  const value = {
    membership,
    administratorAccess: projection?.administratorAccess === true,
    subscriptionPremium: hasVerifiedSubscriptionPremium(projection),
    type,
    isPremium,
    entitlementState: projection?.administratorAccess ? 'premium' : verifying ? 'loading' : refreshing ? 'reconciling' : unresolved || policyQuery.isError || cachedMembership?._reconciliation_status === 'unavailable' || membership?._server_authorized === false ? 'unavailable' : isPremium ? 'premium' : 'explorer',
    loading: verifying,
    refreshing,
    initializingStore: loading,
    reconciliationStatus: membership?._reconciliation_status,
    check,
    can,
    hasPermission: can,
    remainingLimits: (feature) => remainingLimit(feature, { ...membership, explorer_policy: policyQuery.data }),
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

  };

  return (
    <MembershipContext.Provider value={value}>
      {children}
      <WelcomeToPremium />
      <ExplorerUpgradeNudge
        eligible={shouldShowExplorerUpgradeNudge({
          user,
          type,
          isPremium,
          administratorAccess: projection?.administratorAccess === true,
          entitlementState: value.entitlementState,
          // Older test/native bridge shims expose only isNativePlatform().
          // Treat that unknown platform as web, never as iOS.
          platform: typeof Capacitor.getPlatform === 'function' ? Capacitor.getPlatform() : 'web',
          pathname: location.pathname,
        })}
        onUpgrade={() => showUpgrade('timed_explorer_upgrade_nudge')}
      />
    </MembershipContext.Provider>
  );
}

export function useMembershipAccess() {
  const ctx = useContext(MembershipContext);
  if (!ctx) throw new Error('useMembershipAccess must be used within MembershipProvider');
  return ctx;
}
