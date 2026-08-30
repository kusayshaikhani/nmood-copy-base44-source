// RevenueCat Client — Nmood Premium subscription management via official SDK.
// Initializes ONLY after Supabase authentication. Uses Supabase user UUID as
// the App User ID for consistent cross-device entitlement sync.
//
// All product IDs, prices, and entitlements are fetched from RevenueCat's
// configured `default` offering. No hardcoded prices or product lists.
//
// No RevenueCat secrets are exposed client-side. The public iOS SDK API key
// is bundled only (configured at build time).

import { Capacitor } from '@capacitor/core';

// Production public iOS SDK API key — the only RevenueCat credential in client code.
// This is safe to commit; it's a public key used for client-side initialization only.
const REVENUECAT_PUBLIC_SDK_KEY = import.meta.env.VITE_REVENUECAT_APPLE_API_KEY;

// Entitlement identifier defined in RevenueCat dashboard.
const REVENUECAT_ENTITLEMENT_ID = 'nmood_premium';

// Offering identifier to fetch products from.
const REVENUECAT_OFFERING_ID = 'default';

// Cached customer info to avoid unnecessary API calls.
let cachedCustomerInfo = null;
let cachedOffering = null;

// Whether RevenueCat has been initialized for the current session.
let isInitialized = false;

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
  if (!supabaseUserId) {
    throw new RevenueCatError('Supabase user ID required for RevenueCat initialization', 'NO_USER_ID');
  }

  if (!REVENUECAT_PUBLIC_SDK_KEY) {
    throw new RevenueCatError(
      'RevenueCat public SDK key not configured (VITE_REVENUECAT_APPLE_API_KEY)',
      'MISSING_SDK_KEY'
    );
  }

  try {
    const plugin = Capacitor.Plugins.Purchases;
    if (!plugin) {
      throw new RevenueCatError('RevenueCat Purchases plugin not available', 'PLUGIN_NOT_FOUND');
    }

    // Initialize SDK with public key and Supabase user ID as App User ID.
    await plugin.configure({
      apiKey: REVENUECAT_PUBLIC_SDK_KEY,
      appUserID: supabaseUserId,
      observerMode: false, // Let SDK manage receipts
      userDefaults: null,   // Use defaults
      logLevel: import.meta.env.DEV ? 'debug' : 'warning',
    });

    isInitialized = true;
  } catch (err) {
    throw new RevenueCatError(`RevenueCat initialization failed: ${err.message}`, 'INIT_FAILED');
  }
}

/**
 * Fetch available products from RevenueCat's `default` offering.
 * This is the source of truth for pricing, durations, and availability.
 *
 * @returns {Promise<Array<{ id, title, price, localizedPrice, period, productId }>>}
 * @throws {RevenueCatError}
 */
export async function getAvailableProducts() {
  if (!isInitialized) {
    throw new RevenueCatError('RevenueCat not initialized', 'NOT_INITIALIZED');
  }

  // Return cached offering if available
  if (cachedOffering) {
    return transformOfferingToProducts(cachedOffering);
  }

  try {
    const plugin = Capacitor.Plugins.Purchases;
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
    let planId = 'monthly';
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
      title: product.title || '',
      price: product.priceString || '',
      localizedPrice: product.priceString || '',
      currency: product.currencyCode || 'USD',
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
export async function purchasePackage(rcPackage) {
  if (!isInitialized) {
    return { ok: false, error: 'Subscriptions are not ready yet. Please reopen the app and try again.', code: 'NOT_INITIALIZED' };
  }
  if (!rcPackage || !rcPackage.identifier) {
    return { ok: false, error: 'That plan is unavailable right now. Please try another plan.', code: 'NO_PACKAGE' };
  }

  try {
    const plugin = Capacitor.Plugins.Purchases;
    // purchasePackage is the supported API; the previously used
    // purchaseProduct() does not exist on this plugin and always rejected.
    const response = await plugin.purchasePackage({ aPackage: rcPackage });

    const customerInfo = response?.customerInfo;
    if (!customerInfo) {
      return { ok: false, error: 'The purchase did not return a receipt. Please try Restore Purchases.', code: 'NO_CUSTOMER_INFO' };
    }

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
    return normalizePurchaseError(err);
  }
}

// Turns a rejected RevenueCat call into a safe, displayable reason + code.
// User cancellation is a normal outcome, not a failure to report.
export function normalizePurchaseError(err) {
  const code = err?.code || err?.errorCode || err?.data?.code || 'UNKNOWN';
  const cancelled = err?.userCancelled === true
    || code === 'PurchaseCancelledError'
    || code === '1'
    || /cancel/i.test(String(err?.message || ''));
  if (cancelled) return { ok: false, cancelled: true, code: 'PURCHASE_CANCELLED' };
  const message = err?.underlyingErrorMessage || err?.readableErrorCode || err?.message || 'The purchase could not be completed.';
  return { ok: false, error: String(message), code: String(code) };
}

/**
 * Restore prior purchases from the Apple/Google store.
 *
 * @returns {Promise<{ success: true, customerInfo } | { success: false, error: string }>}
 */
export async function restorePurchases() {
  if (!isInitialized) {
    return { ok: false, error: 'Subscriptions are not ready yet. Please reopen the app and try again.', code: 'NOT_INITIALIZED' };
  }

  try {
    const plugin = Capacitor.Plugins.Purchases;
    const response = await plugin.restorePurchases();

    const customerInfo = response?.customerInfo;
    if (!customerInfo) {
      return { ok: false, error: 'Restore did not return a receipt.', code: 'NO_CUSTOMER_INFO' };
    }

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
export async function getCustomerInfo() {
  if (!isInitialized) {
    throw new RevenueCatError('RevenueCat not initialized', 'NOT_INITIALIZED');
  }

  try {
    const plugin = Capacitor.Plugins.Purchases;
    const response = await plugin.getCustomerInfo();

    if (!response?.customerInfo) {
      throw new RevenueCatError('No customer info available', 'NO_CUSTOMER_INFO');
    }

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

  const entitlements = customerInfo.entitlements || {};
  // entitlements is { all: {...}, active: {...} } — indexing it directly by the
  // entitlement id always returned undefined, so Premium never activated.
  const premiumEntitlement = entitlements.active?.[REVENUECAT_ENTITLEMENT_ID]
    || entitlements.all?.[REVENUECAT_ENTITLEMENT_ID]
    || null;

  if (!premiumEntitlement || !premiumEntitlement.isActive) {
    return { customerInfo, isPremium: false, renewalDate: null, plan: null };
  }

  // Extract renewal date and plan from the entitlement
  const renewalDate = premiumEntitlement.expiresDate
    ? new Date(premiumEntitlement.expiresDate).toISOString()
    : null;

  // Determine plan from the subscription product identifier
  let plan = null;
  if (premiumEntitlement.productIdentifier) {
    if (premiumEntitlement.productIdentifier.includes('annual') || premiumEntitlement.productIdentifier.includes('yearly')) {
      plan = 'annual';
    } else if (premiumEntitlement.productIdentifier.includes('quarterly')) {
      plan = 'quarterly';
    } else if (premiumEntitlement.productIdentifier.includes('six_month') || premiumEntitlement.productIdentifier.includes('halfyear')) {
      plan = 'halfyear';
    } else {
      plan = 'monthly';
    }
  }

  return {
    customerInfo,
    isPremium: true,
    renewalDate,
    plan,
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
  try {
    const plugin = Capacitor.Plugins.Purchases;
    if (plugin.manageSubscriptions) {
      await plugin.manageSubscriptions();
      return;
    }
  } catch (err) {
    // Fall through to web fallback
  }

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
export function getCachedEntitlementInfo() {
  if (!cachedCustomerInfo) return null;
  return extractEntitlementInfo(cachedCustomerInfo);
}

/**
 * Clear cached data (useful on logout).
 */
export function clearRevenueCatCache() {
  cachedCustomerInfo = null;
  cachedOffering = null;
  isInitialized = false;
}
