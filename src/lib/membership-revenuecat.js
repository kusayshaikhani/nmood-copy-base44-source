// Membership Engine (RevenueCat-backed) — derive membership state from RevenueCat
// entitlements. This replaces the previous Base44 subscriptionService path.
//
// RevenueCat is the single source of truth for premium entitlements. Membership
// status is derived from the active `nmood_premium` entitlement.

import { withTimeout } from '@/lib/bounded-operation';
import { callSupabaseRpc, invokeSupabaseFunction } from '@/api/supabaseClient';

import {
  initializeRevenueCat,
  getCustomerInfo,
  purchasePackage,
  restorePurchases,
  openManageSubscriptions,
  getAvailableProducts,
} from '@/lib/revenuecat-client';

// Explorer is the only locally constructible access state. Premium objects
// below are built exclusively from the authenticated server permission RPC.
function explorerMembership(supabaseUserId) {
  return { id: `explorer-${supabaseUserId}`, user_id: supabaseUserId,
    type: 'explorer', status: 'active', plan: null, renewal_date: null,
    billing_platform: null, active: true };
}

/**
 * Initialize RevenueCat membership system for a Supabase-authenticated user.
 * Must be called once per authenticated session.
 *
 * @param {string} supabaseUserId - Supabase auth.users.id
 * @returns {Promise<object>} Derived membership object
 */
export async function initializeMembership(supabaseUserId, options) {
  return reconcileMembership(supabaseUserId, options);
}

/**
 * Purchase a package from the live `default` offering.
 *
 * @param {string} supabaseUserId
 * @param {object} rcPackage - RevenueCat package from getAvailablePlans()
 * @returns {Promise<{ ok, membership, cancelled?, error?, code? }>}
 */
let purchaseInFlight = false;
export async function purchaseMembership(supabaseUserId, rcPackage, options) {
  if (purchaseInFlight) return { ok: false, pending: true, code: 'PURCHASE_IN_PROGRESS', error: 'Purchase confirmation is already in progress.' };
  purchaseInFlight = true;
  try {
    await initializeRevenueCat(supabaseUserId);
    const result = await purchasePackage(rcPackage);
    if (!result.ok && !result.alreadySubscribed && result.code !== 'CURRENT_SUBSCRIPTION') {
      return {
        ok: false,
        membership: null,
        cancelled: !!result.cancelled,
        pending: !!result.pending,
        error: result.error,
        code: result.code,
      };
    }
    // Membership is derived from the verified entitlement, never assumed.
    const membership = await reconcileMembership(supabaseUserId, options);
    const ok = membership?.type === 'premium' && membership._server_authorized === true;
    return { ok, membership, error: ok ? undefined : 'Your purchase is awaiting verification. Try again or Restore Purchases; do not buy again.' };
  } catch (err) {
    return { ok: false, membership: null, error: err.message, code: err?.code || 'UNKNOWN' };
  } finally {
    purchaseInFlight = false;
  }
}

/**
 * Restore prior purchases.
 *
 * @param {string} supabaseUserId
 * @returns {Promise<{ ok: boolean, membership: object|null, error?: string }>}
 */
export async function restoreMembership(supabaseUserId, options) {
  try {
    try {
      await initializeRevenueCat(supabaseUserId);
      await restorePurchases();
    } catch {
      // A native restore failure cannot erase trusted server access. The
      // account may already have a subscription registered under its UUID.
    }
    const membership = await reconcileMembership(supabaseUserId, options);
    const ok = membership?.type === 'premium' && membership._server_authorized === true;
    return { ok, membership, error: ok ? undefined : 'Membership could not be confirmed. Please try again.' };
  } catch (err) {
    return { ok: false, membership: null, error: err.message, code: err?.code || 'UNKNOWN' };
  }
}

/**
 * Refresh membership entitlement from RevenueCat (after purchase, restore, foreground).
 *
 * @param {string} supabaseUserId
 * @returns {Promise<object|null>}
 */
export async function reconcileMembership(supabaseUserId, { signal, onServerStatus, verifyPurchases = true } = {}) {
  let serverConfirmedExplorer = false;
  let verification = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    if (signal?.aborted) return null;
    const [storeResult, serverResult] = await Promise.allSettled([
      withTimeout(async () => {
        if (signal?.aborted) return null;
        // Also runs on retry: a failed SDK initialization is recoverable.
        await initializeRevenueCat(supabaseUserId);
        if (signal?.aborted) return null;
        return getCustomerInfo({ fresh: true });
      }),
      withTimeout(async requestSignal => {
        // Works on a fresh device even when native SDK initialization fails.
        // Only the authenticated server can verify and repair the projection.
        let providerVerified = !verifyPurchases;
        try {
          if (verifyPurchases) providerVerified = (await invokeSupabaseFunction('reconcile-membership', {}, { signal: requestSignal }))?.ok === true;
        } catch {
          // An outage must not erase an existing, still-valid server grant.
        }
        if (signal?.aborted || requestSignal.aborted) return null;
        const server = await callSupabaseRpc('nmood_get_my_membership_status', {}, { signal: requestSignal });
        return { ...server, providerVerified };
      }, 12000),
    ]);
    if (signal?.aborted) return null;
    const storeInfo = storeResult.status === 'fulfilled' ? storeResult.value : null;
    const server = serverResult.status === 'fulfilled' ? serverResult.value : null;
    verification = { checkedAt: new Date().toISOString(), revenueCat: storeInfo ? (storeInfo.isPremium ? 'premium' : 'explorer') : 'unavailable', projection: typeof server?.premium === 'boolean' ? (server.premium ? 'premium' : 'explorer') : 'unavailable' };
    if (server?.premium === true) onServerStatus?.(server);
    if (server?.premium === true) {
      return {
        id: 'premium-' + supabaseUserId, user_id: supabaseUserId,
        type: 'premium', status: server.status || 'active', active: true,
        expires_at: server.expires_at || null, renewal_date: server.expires_at || null,
        plan: storeInfo?.plan || null, product_id: server.product_id || null, auto_renew: server.auto_renew ?? null, billing_platform: server.billing_platform || (storeInfo?.isPremium ? 'apple' : null),
        _verification: verification, _server_authorized: true, _projection_pending: false, _reconciliation_status: 'confirmed',
      };
    }
    serverConfirmedExplorer = server?.premium === false;
    if (serverConfirmedExplorer && server.providerVerified && storeInfo && !storeInfo.isPremium) {
      onServerStatus?.(server);
      return { ...explorerMembership(supabaseUserId), _verification: verification, _server_authorized: true, _projection_pending: false, _reconciliation_status: 'confirmed' };
    }
  }
  // Bounded recovery is over. Never grant Premium from the store alone, or
  // leave the UI claiming that reconciliation is still running.
  return {
    ...explorerMembership(supabaseUserId),
    _verification: verification, _server_authorized: false, _projection_pending: false,
    _reconciliation_status: serverConfirmedExplorer ? 'not_confirmed' : 'unavailable',
  };
}

export async function refreshMembership(supabaseUserId, options) {
  return reconcileMembership(supabaseUserId, options);
}

/**
 * Open native Apple Manage Subscriptions UI.
 *
 * @returns {Promise<void>}
 */
export async function openManageMembership() {
  return openManageSubscriptions();
}

/**
 * Fetch available products to purchase.
 *
 * @returns {Promise<Array>}
 */
export async function getAvailablePlans() {
  return getAvailableProducts();
}

// Browser access comes only from the authenticated server, never a native-store cache.
export async function reconcileWebMembership(supabaseUserId, { signal, onServerStatus } = {}) {
  if (!supabaseUserId || signal?.aborted) return null;
  try {
    const server = await withTimeout(requestSignal => callSupabaseRpc('nmood_get_my_membership_status', {}, { signal: requestSignal }), 12000);
    if (signal?.aborted) return null;
    if (typeof server?.premium !== 'boolean') throw new Error('MEMBERSHIP_STATUS_UNAVAILABLE');
    onServerStatus?.(server);
    return { ...explorerMembership(supabaseUserId), type: server.premium ? 'premium' : 'explorer',
      status: server.status || 'active', expires_at: server.expires_at || null,
      renewal_date: server.expires_at || null, product_id: server.product_id || null,
      billing_platform: server.billing_platform || null, auto_renew: server.auto_renew ?? null,
      _server_authorized: true, _projection_pending: false, _reconciliation_status: 'confirmed' };
  } catch {
    if (signal?.aborted) return null;
    return { ...explorerMembership(supabaseUserId), _server_authorized: false,
      _projection_pending: false, _reconciliation_status: 'unavailable' };
  }
}
