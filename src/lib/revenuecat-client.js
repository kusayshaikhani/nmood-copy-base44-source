import { subscriptionName, subscriptionPlan } from '@/lib/subscription-display';
// RevenueCat Client — Nmood Premium subscription management via official SDK.
// Initializes ONLY after Supabase authentication. Uses Supabase user UUID as
// the App User ID for consistent cross-device entitlement sync.
//
// All product IDs, prices, and entitlements are fetched from RevenueCat's
// configured `default` offering. No hardcoded prices or product lists.
//
// No RevenueCat secrets are exposed client-side. The public iOS SDK API key
// is bundled only (configured at build time).

import { withTimeout } from '@/lib/bounded-operation';
import { Capacitor } from '@capacitor/core';
import { Purchases } from '@revenuecat/purchases-capacitor';

// Platform-specific public SDK keys; server verification uses a separate secret.
const REVENUECAT_PUBLIC_SDK_KEY = Capacitor.getPlatform() === 'android'
  ? import.meta.env.VITE_REVENUECAT_GOOGLE_API_KEY
  : import.meta.env.VITE_REVENUECAT_APPLE_API_KEY;

// Entitlement identifier defined in RevenueCat dashboard.
const REVENUECAT_ENTITLEMENT_ID = 'nmood_premium';

// Offering identifier to fetch products from.
const REVENUECAT_OFFERING_ID = 'default';

// Cached customer info to avoid unnecessary API calls.
let cachedCustomerInfo = null;
let cachedOffering = null;

// Whether RevenueCat has been initialized for the current session.
let isInitialized = false;
let sdkConfigured = false;
let identityGeneration = 0;
let currentUserId = null;
let identityQueue = Promise.resolve();
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function assertCurrentIdentity(generation) {
  if (!isInitialized || generation !== identityGeneration) {
    throw new RevenueCatError('Subscription account changed. Please try again.', 'IDENTITY_CHANGED');
  }
}

export class RevenueCatError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'RevenueCatError';
    this.code = code;
  }
}

/**
 * Initialize RevenueCat SDK after Supabase authentication.
 * Must be called ONCE per session, after the user is authenticated.
 *
 * @param {string} supabaseUserId - Supabase auth.users.id (UUID)
 * @returns {Promise<void>}
 * @throws {RevenueCatError} if initialization fails
 */
export async function initializeRevenueCat(supabaseUserId) {
  if (!supabaseUserId) throw new RevenueCatError('Supabase user ID required', 'NO_USER_ID');
  if (!UUID.test(supabaseUserId)) throw new RevenueCatError('Invalid Supabase user ID', 'INVALID_USER_ID');
  if (!REVENUECAT_PUBLIC_SDK_KEY) throw new RevenueCatError('RevenueCat SDK key not configured', 'MISSING_SDK_KEY');
  if (isInitialized && currentUserId === supabaseUserId) return;
  clearRevenueCatCache();
  const generation = identityGeneration;
  const operation = identityQueue.catch(() => {}).then(async () => {
    if (generation !== identityGeneration) throw new RevenueCatError('Account changed', 'IDENTITY_CHANGED');
    if (!sdkConfigured) {
      await Purchases.configure({ apiKey: REVENUECAT_PUBLIC_SDK_KEY, appUserID: supabaseUserId });
      sdkConfigured = true;
    } else {
      await Purchases.logIn({ appUserID: supabaseUserId });
    }
    if (generation !== identityGeneration) throw new RevenueCatError('Account changed', 'IDENTITY_CHANGED');
    currentUserId = supabaseUserId;
    isInitialized = true;
  });
  identityQueue = operation;
  // Bound the caller, while keeping native identity changes serialized. A
  // late configure/login must finish before another native identity change.
  await withTimeout(() => operation);
}

/**
 * Fetch available products from RevenueCat's `default` offering.
 * This is the source of truth for pricing, durations, and availability.
 *
 * @returns {Promise<Array<{ id, title, price, localizedPrice, period, productId }>>}
 * @throws {RevenueCatError}
 */
export async function getAvailableProducts({ fresh = false } = {}) {
  const generation = identityGeneration;
  if (!isInitialized) {
    throw new RevenueCatError('RevenueCat not initialized', 'NOT_INITIALIZED');
  }

  // Return cached offering if available
  if (cachedOffering && !fresh) {
    return transformOfferingToProducts(cachedOffering);
  }

  try {
    const plugin = Purchases;
    const response = await plugin.getOfferings();

    // getOfferings() resolves to { all: { [id]: offering }, current }, not an
    // array — reading `.offerings` here always yielded undefined and made every
    // product fetch fail.
    const all = response?.all || {};
    const offering = all[REVENUECAT_OFFERING_ID] || null;
    if (!offering) {
      const available = Object.keys(all);
      throw new RevenueCatError(
        available.length === 0
          ? 'No offerings returned by RevenueCat. Check that the App Store products are Ready to Submit and attached to an offering.'
          : `Offering "${REVENUECAT_OFFERING_ID}" not found. Offerings returned: ${available.join(', ')}`,
        available.length === 0 ? 'NO_OFFERINGS' : 'OFFERING_NOT_FOUND'
      );
    }
    if (!offering.availablePackages || offering.availablePackages.length === 0) {
      throw new RevenueCatError(
        `Offering "${REVENUECAT_OFFERING_ID}" has no available packages. The App Store products are likely not approved or not attached to the offering.`,
        'NO_PACKAGES'
      );
    }

    assertCurrentIdentity(generation);
    cachedOffering = offering;
    return transformOfferingToProducts(offering);
  } catch (err) {
    if (err instanceof RevenueCatError) throw err;
    throw new RevenueCatError(`Failed to fetch products: ${err.message}`, err?.code || 'FETCH_FAILED');
  }
}

/**
 * Internal: transform RevenueCat offering into UI-friendly product list.
 */
function transformOfferingToProducts(offering) {
  if (!offering?.availablePackages) return [];

  return offering.availablePackages.map((pkg) => {
    const product = pkg.product || {};
    const identifier = pkg.identifier || 'unknown';

    // Map RevenueCat package IDs ($rc_monthly, $rc_annual, etc.) to plan IDs
    let planId = null;
    if (identifier.includes('monthly')) planId = 'monthly';
    if (identifier.includes('annual') || identifier.includes('yearly')) {
      planId = 'annual';
    } else if (identifier.includes('quarterly') || identifier.includes('three_month')) {
      planId = 'quarterly';
    } else if (identifier.includes('six_month') || identifier.includes('halfyear')) {
      planId = 'halfyear';
    }

    return {
      id: identifier,
      planId,
      productId: product.identifier,
      title: subscriptionName({ period: product.subscriptionPeriod, planId, productId: product.identifier }),
      price: product.priceString || '',
      localizedPrice: product.priceString || '',
      currency: product.currencyCode || '',
      period: product.subscriptionPeriod || '',
      introOfferEligible: !!pkg.introductoryPrice,
      // The SDK purchases packages, not bare identifiers — keep the original.
      rcPackage: pkg,
    };
  });
}

/**
 * Purchase a package from the `default` offering.
 *
 * @param {object} rcPackage - the RevenueCat package object from getAvailableProducts()
 * @returns {Promise<{ ok: boolean, customerInfo?, isPremium?, cancelled?, error?, code? }>}
 */
let nativePurchaseInFlight = false;
export async function purchasePackage(rcPackage) {
  if (nativePurchaseInFlight) return { ok: false, pending: true, code: 'PURCHASE_IN_PROGRESS', error: 'Purchase confirmation is already in progress.' };
  const generation = identityGeneration;
  if (!isInitialized) {
    return { ok: false, error: 'Subscriptions are not ready yet. Please reopen the app and try again.', code: 'NOT_INITIALIZED' };
  }
  if (!rcPackage || !rcPackage.identifier) {
    return { ok: false, error: 'That plan is unavailable right now. Please try another plan.', code: 'NO_PACKAGE' };
  }

  nativePurchaseInFlight = true;
  try {
    const current = await withTimeout(() => getCustomerInfo({ fresh: true }));
    assertCurrentIdentity(generation);
    if (current.isPremium || current.activeProductIds?.length) return { ok: false, alreadySubscribed: true, currentSubscription: current, code: 'CURRENT_SUBSCRIPTION', error: `Your ${subscriptionName(current)} subscription is active. Use Manage subscription to review your plan.` };
    const plugin = Purchases;
    // purchasePackage is the supported API; the previously used
    // purchaseProduct() does not exist on this plugin and always rejected.
    const response = await plugin.purchasePackage({ aPackage: rcPackage });

    const customerInfo = response?.customerInfo;
    if (!customerInfo) {
      return { ok: false, error: 'The purchase did not return a receipt. Please try Restore Purchases.', code: 'NO_CUSTOMER_INFO' };
    }

    assertCurrentIdentity(generation);
    cachedCustomerInfo = customerInfo;
    const info = extractEntitlementInfo(customerInfo);
    // Premium is granted only by an active nmood_premium entitlement, never by
    // the purchase call resolving.
    if (!info.isPremium) {
      return {
        ok: false,
        customerInfo,
        isPremium: false,
        error: 'Apple accepted the payment but Premium is not active yet. It can take a moment — try Restore Purchases.',
        code: 'ENTITLEMENT_NOT_ACTIVE',
      };
    }
    return { ok: true, customerInfo, isPremium: true };
  } catch (err) {
    // Another device can subscribe after our preflight. Recover without asking
    // the member to buy again or presenting the store's already-owned error.
    if (err?.code === 'ProductAlreadyPurchasedError') {
      return { ok: false, alreadySubscribed: true, code: 'CURRENT_SUBSCRIPTION', error: 'Refresh your current subscription or use Restore Purchases.' };
    }
    const failure = normalizePurchaseError(err);
    return { ...failure, error: `${subscriptionName({ period: rcPackage.product?.subscriptionPeriod, productId: rcPackage.product?.identifier })}: ${failure.error}` };
  } finally {
    nativePurchaseInFlight = false;
  }
}

// Turns a rejected RevenueCat call into a safe, displayable reason + code.
// User cancellation is a normal outcome, not a failure to report.
export function normalizePurchaseError(err) {
  const code = err?.code || err?.errorCode || err?.data?.code || 'UNKNOWN';
  const message = err?.underlyingErrorMessage || err?.readableErrorCode || err?.message || 'The purchase could not be completed.';
  const text = String(message || '');

  const pending = code === 'PurchasePendingError'
    || /pending/i.test(text)
    || code === 'PURCHASE_PENDING';
  if (pending) {
    return {
      ok: false,
      pending: true,
      code: 'PURCHASE_PENDING',
      error: 'Your purchase is still pending approval in the App Store. We will refresh Premium access as soon as Apple confirms it.',
    };
  }

  const cancelled = err?.userCancelled === true
    || code === 'PurchaseCancelledError'
    || code === '1'
    || /cancel/i.test(text);
  if (cancelled) {
    return {
      ok: false,
      cancelled: true,
      code: 'PURCHASE_CANCELLED',
      error: 'Purchase cancelled. No charge was made.',
    };
  }

  return { ok: false, error: String(text), code: String(code) };
}

/**
 * Restore prior purchases from the Apple/Google store.
 *
 * @returns {Promise<{ ok: boolean, customerInfo?: object, isPremium?: boolean, error?: string, code?: string }>}
 */
export async function restorePurchases() {
  const generation = identityGeneration;
  if (!isInitialized) {
    return { ok: false, error: 'Subscriptions are not ready yet. Please reopen the app and try again.', code: 'NOT_INITIALIZED' };
  }

  try {
    const plugin = Purchases;
    const response = await plugin.restorePurchases();

    const customerInfo = response?.customerInfo;
    if (!customerInfo) {
      return { ok: false, error: 'Restore did not return a receipt.', code: 'NO_CUSTOMER_INFO' };
    }

    assertCurrentIdentity(generation);
    cachedCustomerInfo = customerInfo;
    const info = extractEntitlementInfo(customerInfo);
    return { ok: info.isPremium, customerInfo, isPremium: info.isPremium };
  } catch (err) {
    const code = err?.code || 'RESTORE_FAILED';
    return { ok: false, error: err?.message || 'Restore failed', code: String(code) };
  }
}

/**
 * Fetch current customer entitlements and subscription status.
 * This is called after purchase, restore, and app foreground to refresh state.
 *
 * @returns {Promise<{ customerInfo: object, isPremium: boolean, renewalDate: string|null }>}
 * @throws {RevenueCatError}
 */
export async function getCustomerInfo({ fresh = false } = {}) {
  const generation = identityGeneration;
  if (!isInitialized) {
    throw new RevenueCatError('RevenueCat not initialized', 'NOT_INITIALIZED');
  }

  try {
    const plugin = Purchases;
    if (fresh && typeof plugin.invalidateCustomerInfoCache === 'function') {
      await plugin.invalidateCustomerInfoCache();
    }
    const response = await plugin.getCustomerInfo();

    if (!response?.customerInfo) {
      throw new RevenueCatError('No customer info available', 'NO_CUSTOMER_INFO');
    }

    assertCurrentIdentity(generation);
    cachedCustomerInfo = response.customerInfo;
    const info = extractEntitlementInfo(response.customerInfo);
    return info;
  } catch (err) {
    if (err instanceof RevenueCatError) throw err;
    throw new RevenueCatError(`Failed to fetch customer info: ${err.message}`, 'FETCH_FAILED');
  }
}

/**
 * Internal: extract premium status and renewal date from RevenueCat customer info.
 */
function extractEntitlementInfo(customerInfo) {
  if (!customerInfo) {
    return { customerInfo: null, isPremium: false, renewalDate: null, plan: null };
  }

  const activeProductIds = Array.isArray(customerInfo.activeSubscriptions) ? customerInfo.activeSubscriptions.filter(id => typeof id === 'string') : [];
  const entitlements = customerInfo.entitlements || {};
  // entitlements is { all: {...}, active: {...} } — indexing it directly by the
  // entitlement id always returned undefined, so Premium never activated.
  const premiumEntitlement = entitlements.active?.[REVENUECAT_ENTITLEMENT_ID]
    || entitlements.all?.[REVENUECAT_ENTITLEMENT_ID]
    || null;

  const rawExpiry = premiumEntitlement?.expirationDate
    || premiumEntitlement?.expiresDate
    || (Number.isFinite(premiumEntitlement?.expirationDateMillis)
      ? premiumEntitlement.expirationDateMillis
      : null);
  const expiryMs = rawExpiry == null ? null : new Date(rawExpiry).getTime();
  const hasValidExpiry = expiryMs == null || (Number.isFinite(expiryMs) && expiryMs > Date.now());

  if (!premiumEntitlement || !premiumEntitlement.isActive || !hasValidExpiry) {
    return { customerInfo, isPremium: false, renewalDate: null, plan: null, activeProductIds, productId: activeProductIds.length === 1 ? activeProductIds[0] : null };
  }

  // Extract renewal date and plan from the entitlement
  const renewalDate = expiryMs != null
    ? new Date(expiryMs).toISOString()
    : null;

  const plan = subscriptionPlan({ productId: premiumEntitlement.productIdentifier });

  return {
    customerInfo,
    isPremium: true,
    renewalDate,
    plan,
    activeProductIds,
    productId: premiumEntitlement.productIdentifier || null,
    willRenew: premiumEntitlement.willRenew,
    entitlementId: REVENUECAT_ENTITLEMENT_ID,
    isActive: premiumEntitlement.isActive,
  };
}

/**
 * Open Apple App Store Manage Subscriptions screen.
 * Uses the native Capacitor bridge; falls back to web URL if unavailable.
 *
 * @returns {Promise<void>}
 */
export async function openManageSubscriptions() {
  // Web fallback — open App Store subscriptions page
  if (Capacitor.getPlatform() === 'android') {
    window.open('https://play.google.com/store/account/subscriptions', '_blank');
  } else {
    window.open('https://apps.apple.com/account/subscriptions', '_blank');
  }
}

/**
 * Get the cached customer info without making a network call.
 * Use this in render paths to avoid extra latency.
 *
 * @returns {object|null}
 */
export function getCachedCustomerInfo() {
  return cachedCustomerInfo;
}

/**
 * Entitlement summary from the cached customer info, without a network call.
 * @returns {object|null}
 */
export function getCachedEntitlementInfo(userId = currentUserId) {
  if (userId !== currentUserId || !isInitialized || !cachedCustomerInfo) return null;
  return extractEntitlementInfo(cachedCustomerInfo);
}

/**
 * Clear cached data (useful on logout).
 */
export function clearRevenueCatCache() {
  // Custom-ID-only policy: disable purchases while signed out; next login uses
  // logIn(UUID), without creating an anonymous identity via SDK logOut().
  identityGeneration++;
  currentUserId = null;
  cachedCustomerInfo = null;
  cachedOffering = null;
  isInitialized = false;
}

// React to actual entitlement changes, not every SDK CustomerInfo emission.
// The callback only asks the server to reconcile; SDK state never grants access.
export function watchSubscriptionChanges(onChange) {
  if (!Capacitor.isNativePlatform()) return () => {};
  let stopped = false;
  let previous;
  let listener;
  Purchases.addCustomerInfoUpdateListener(info => {
    if (stopped || !isInitialized) return;
    const entitlement = info?.entitlements?.all?.[REVENUECAT_ENTITLEMENT_ID];
    const signature = JSON.stringify([currentUserId, entitlement?.isActive, entitlement?.expirationDate, entitlement?.willRenew, entitlement?.productIdentifier]);
    if (previous !== undefined && signature !== previous) onChange();
    previous = signature;
  }).then(id => { listener = id; if (stopped) void Purchases.removeCustomerInfoUpdateListener({ listenerToRemove: id }); }).catch(() => {});
  return () => { stopped = true; if (listener) void Purchases.removeCustomerInfoUpdateListener({ listenerToRemove: listener }); };
}
