// Membership Engine (RevenueCat-backed) — derive membership state from RevenueCat
// entitlements. This replaces the previous Base44 subscriptionService path.
//
// RevenueCat is the single source of truth for premium entitlements. Membership
// status is derived from the active `nmood_premium` entitlement.

import {
  initializeRevenueCat,
  getCustomerInfo,
  getCachedCustomerInfo,
  purchaseProduct,
  restorePurchases,
  openManageSubscriptions,
  getAvailableProducts,
} from '@/lib/revenuecat-client';

/**
 * Build a Membership-like object from RevenueCat customer info.
 * This standardizes the entitlement response into the shape expected by
 * MembershipProvider and permission checks.
 *
 * @param {object} revenuecat info from RevenueCat
 * @returns {object} membership shape { id, user_id, type, status, plan, renewal_date, ... }
 */
export function deriveMembershipFromRevenueCat(supabaseUserId, rcInfo) {
  if (!rcInfo || !rcInfo.isPremium) {
    // No premium entitlement — Explorer
    return {
      id: `explorer-${supabaseUserId}`,
      user_id: supabaseUserId,
      type: 'explorer',
      status: 'active',
      plan: null,
      renewal_date: null,
      billing_platform: null,
      started_date: new Date().toISOString(),
      active: true,
    };
  }

  // Premium entitlement active
  return {
    id: `premium-${supabaseUserId}`, // Synthetic ID based on Supabase user
    user_id: supabaseUserId,
    type: 'premium',
    status: rcInfo.isActive ? 'active' : 'expired',
    plan: rcInfo.plan || 'monthly',
    renewal_date: rcInfo.renewalDate || null,
    billing_platform: 'apple', // TODO: Derive from RevenueCat product identifier if needed
    started_date: new Date().toISOString(),
    active: rcInfo.isActive,
    _revenuecat_info: rcInfo, // Preserve raw RevenueCat info for debugging
  };
}

/**
 * Initialize RevenueCat membership system for a Supabase-authenticated user.
 * Must be called once per authenticated session.
 *
 * @param {string} supabaseUserId - Supabase auth.users.id
 * @returns {Promise<object>} Derived membership object
 */
export async function initializeMembership(supabaseUserId) {
  try {
    await initializeRevenueCat(supabaseUserId);
    const info = await getCustomerInfo();
    return deriveMembershipFromRevenueCat(supabaseUserId, info);
  } catch (err) {
    console.error('Failed to initialize membership:', err);
    // Fail gracefully — return Explorer membership if RevenueCat fails
    return {
      id: `explorer-${supabaseUserId}`,
      user_id: supabaseUserId,
      type: 'explorer',
      status: 'active',
      plan: null,
      renewal_date: null,
      billing_platform: null,
      started_date: new Date().toISOString(),
      active: true,
    };
  }
}

/**
 * Fetch current membership status from RevenueCat (network call).
 *
 * @param {string} supabaseUserId
 * @returns {Promise<object>} Derived membership
 */
export async function fetchMembership(supabaseUserId) {
  try {
    const info = await getCustomerInfo();
    return deriveMembershipFromRevenueCat(supabaseUserId, info);
  } catch (err) {
    console.warn('Failed to fetch membership from RevenueCat:', err);
    return null;
  }
}

/**
 * Get cached membership (no network call).
 * Use in render paths to avoid extra latency.
 *
 * @param {string} supabaseUserId
 * @returns {object|null}
 */
export function getCachedMembership(supabaseUserId) {
  try {
    const rcInfo = getCachedCustomerInfo();
    if (!rcInfo) return null;
    return deriveMembershipFromRevenueCat(supabaseUserId, rcInfo);
  } catch (err) {
    return null;
  }
}

/**
 * Purchase a product through RevenueCat.
 * Returns the updated membership if successful.
 *
 * @param {string} supabaseUserId
 * @param {string} productId - RevenueCat product identifier
 * @returns {Promise<{ ok: boolean, membership: object|null, error?: string }>}
 */
export async function purchaseMembership(supabaseUserId, productId) {
  try {
    const result = await purchaseProduct(productId);
    if (!result.success) {
      return { ok: false, membership: null, error: result.error };
    }
    const membership = deriveMembershipFromRevenueCat(supabaseUserId, result.customerInfo);
    return { ok: true, membership };
  } catch (err) {
    return { ok: false, membership: null, error: err.message };
  }
}

/**
 * Restore prior purchases.
 *
 * @param {string} supabaseUserId
 * @returns {Promise<{ ok: boolean, membership: object|null, error?: string }>}
 */
export async function restoreMembership(supabaseUserId) {
  try {
    const result = await restorePurchases();
    if (!result.success) {
      return { ok: false, membership: null, error: result.error };
    }
    const membership = deriveMembershipFromRevenueCat(supabaseUserId, result.customerInfo);
    return { ok: true, membership };
  } catch (err) {
    return { ok: false, membership: null, error: err.message };
  }
}

/**
 * Refresh membership entitlement from RevenueCat (after purchase, restore, foreground).
 *
 * @param {string} supabaseUserId
 * @returns {Promise<object|null>}
 */
export async function refreshMembership(supabaseUserId) {
  return fetchMembership(supabaseUserId);
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
