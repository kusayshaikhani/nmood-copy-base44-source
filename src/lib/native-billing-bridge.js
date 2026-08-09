// MP-005 Native Billing Bridge — abstraction over the device's native in-app
// purchase flow (Apple StoreKit / Google Play Billing). When the app runs
// inside a native wrapper exposing a billing bridge, it launches the real
// store sheet and returns a receipt. When no native bridge is present
// (web/preview), it falls back to a clearly-marked simulated receipt so the
// full membership + permission + welcome flow can be exercised.
// Payments are handled by Apple and Google; this module never processes
// payments itself.

// Internal plan id → store product id, per provider.
// Apple App Store & Google Play use the same product IDs per the production
// configuration. These are auto-renewable subscription product IDs registered
// in App Store Connect and the Google Play Console.
const PRODUCT_IDS = {
  apple: {
    monthly: 'app.nmood.premium.monthly',
    quarterly: 'app.nmood.premium.quarterly',
    halfyear: 'app.nmood.premium.halfyear',
    annual: 'app.nmood.premium.annual',
  },
  google: {
    monthly: 'app.nmood.premium.monthly',
    quarterly: 'app.nmood.premium.quarterly',
    halfyear: 'app.nmood.premium.halfyear',
    annual: 'app.nmood.premium.annual',
  },
};

export function productIdFor(provider, planId) {
  return PRODUCT_IDS[provider]?.[planId] || PRODUCT_IDS.apple[planId] || 'app.nmood.premium.monthly';
}

export function allProductIds(provider) {
  return Object.values(PRODUCT_IDS[provider] || PRODUCT_IDS.apple);
}

export function planIdForProductId(productId) {
  for (const provider of ['apple', 'google']) {
    const entry = Object.entries(PRODUCT_IDS[provider]).find(([, pid]) => pid === productId);
    if (entry) return entry[0];
  }
  return null;
}

// Detect a native billing bridge (Capacitor / WebView message handlers / Android global).
function nativeBridge() {
  if (typeof window === 'undefined') return null;
  if (window.Capacitor?.Plugins?.Billing) return { kind: 'capacitor', impl: window.Capacitor.Plugins.Billing };
  if (window.webkit?.messageHandlers?.NmoodBilling) return { kind: 'ios', impl: window.webkit.messageHandlers.NmoodBilling };
  if (window.NmoodBilling) return { kind: 'android', impl: window.NmoodBilling };
  return null;
}

export function isNativeBillingAvailable() {
  return nativeBridge() !== null;
}

export function detectStore() {
  if (typeof window === 'undefined') return null;
  if (window.Capacitor?.getPlatform) {
    const p = window.Capacitor.getPlatform();
    if (p === 'ios') return 'apple';
    if (p === 'android') return 'google';
  }
  if (window.webkit?.messageHandlers?.NmoodBilling) return 'apple';
  if (window.NmoodBilling) return 'google';
  // UA-based fallback hint
  const ua = navigator?.userAgent || '';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'apple';
  if (/Android/i.test(ua)) return 'google';
  return null;
}

/**
 * Launch the native store purchase sheet for a plan.
 * @returns {Promise<{ ok, provider, productId, receipt, simulated }>}
 */
export async function purchaseProduct(provider, planId) {
  const productId = productIdFor(provider, planId);
  const bridge = nativeBridge();
  if (!bridge) {
    // Dev/preview fallback — simulated receipt, marked clearly.
    return {
      ok: true,
      provider,
      productId,
      receipt: { simulated: true, productId, purchaseToken: `dev_${provider}_${planId}_${Date.now()}` },
      simulated: true,
    };
  }
  try {
    let res;
    if (bridge.kind === 'capacitor') res = await bridge.impl.purchase({ productId });
    else if (bridge.kind === 'ios') res = await bridge.impl.postMessage({ op: 'purchase', productId });
    else res = await bridge.impl.purchase(productId);
    if (!res || res.ok === false) return { ok: false, provider, productId };
    return {
      ok: true,
      provider,
      productId: res.productId || productId,
      receipt: { receiptData: res.receiptData || res.receipt, purchaseToken: res.purchaseToken || res.token, productId: res.productId || productId },
      simulated: false,
    };
  } catch {
    return { ok: false, provider, productId };
  }
}

/**
 * Fetch the store's available receipts/tokens for restore. Returns an array
 * (possibly empty). In dev/preview, returns a single simulated receipt when
 * a prior dev purchase is recorded in sessionStorage.
 */
export async function getAvailableReceipts(provider) {
  const bridge = nativeBridge();
  if (!bridge) {
    const prior = sessionStorage.getItem('nmood_dev_purchase');
    if (!prior) return [];
    return [{ simulated: true, provider, productId: prior }];
  }
  try {
    let res;
    if (bridge.kind === 'capacitor') res = await bridge.impl.getAvailablePurchases();
    else if (bridge.kind === 'ios') res = await bridge.impl.postMessage({ op: 'restore' });
    else res = await bridge.impl.restore();
    const list = Array.isArray(res) ? res : res?.purchases || res?.receipts || [];
    return list.map((p) => ({ receiptData: p.receiptData || p.receipt, purchaseToken: p.purchaseToken || p.token, productId: p.productId, transactionId: p.transactionId || p.originalTransactionId || null }));
  } catch {
    return [];
  }
}

/**
 * Open the device's native subscription management screen (Apple/Google).
 * Cancellations are managed by the store, not by Nmood.
 */
export function openSubscriptionManagement(provider) {
  const bridge = nativeBridge();
  if (bridge) {
    try {
      if (bridge.kind === 'capacitor') bridge.impl.manageSubscriptions?.();
      else if (bridge.kind === 'ios') bridge.impl.postMessage({ op: 'manage' });
      else bridge.impl.manage?.();
      return;
    } catch { /* fall through to web URLs */ }
  }
  if (provider === 'google') {
    window.open('https://play.google.com/store/account/subscriptions', '_blank');
  } else {
    window.open('https://apps.apple.com/account/subscriptions', '_blank');
  }
}

// Fallback prices for web/preview only — never shown to native app users.
const FALLBACK_PRICES = {
  monthly: { price: 'USD 4.99', currency: 'USD', amount: 4.99, label: '1 Month' },
  quarterly: { price: 'USD 12.99', currency: 'USD', amount: 12.99, label: '3 Months' },
  halfyear: { price: 'USD 24.99', currency: 'USD', amount: 24.99, label: '6 Months' },
  annual: { price: 'USD 39.99', currency: 'USD', amount: 39.99, label: '12 Months' },
};

/**
 * Fetch localized product details (price, currency, title) from the native
 * store. On web/preview (no bridge), returns fallback data so the paywall
 * can render. The native app must never hardcode currency amounts — this
 * is the only source of truth for display prices on device.
 * @returns {Promise<Array<{ productId, planId, price, currency, priceAmount, title }>>}
 */
export async function fetchProductDetails(provider) {
  const pids = allProductIds(provider);
  const bridge = nativeBridge();
  if (!bridge) {
    return pids.map((pid) => {
      const planId = planIdForProductId(pid);
      const fb = FALLBACK_PRICES[planId] || {};
      return {
        productId: pid,
        planId,
        price: fb.price || '',
        currency: fb.currency || 'USD',
        priceAmount: fb.amount || 0,
        title: fb.label || '',
        simulated: true,
      };
    });
  }
  try {
    let res;
    if (bridge.kind === 'capacitor') res = await bridge.impl.getProductDetails({ productIds: pids });
    else if (bridge.kind === 'ios') res = await bridge.impl.postMessage({ op: 'fetchProducts', productIds: pids });
    else res = await bridge.impl.fetchProducts(pids);
    const list = Array.isArray(res) ? res : res?.products || res?.items || [];
    return list.map((p) => ({
      productId: p.productId,
      planId: planIdForProductId(p.productId),
      price: p.price || p.formattedPrice || '',
      currency: p.currency || 'USD',
      priceAmount: p.priceAmount || p.priceValue || 0,
      title: p.title || p.name || '',
    }));
  } catch {
    return [];
  }
}