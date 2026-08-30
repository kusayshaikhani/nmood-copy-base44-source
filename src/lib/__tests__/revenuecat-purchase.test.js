import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// The Capacitor plugin bridge is the surface under test — these tests assert we
// call the methods the plugin actually exposes, with the shapes it returns.
const purchases = {
  configure: vi.fn(),
  getOfferings: vi.fn(),
  purchasePackage: vi.fn(),
  restorePurchases: vi.fn(),
  getCustomerInfo: vi.fn(),
};

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    Plugins: { get Purchases() { return purchases; } },
    isNativePlatform: () => true,
    getPlatform: () => 'ios',
  },
}));

const USER_ID = '550e8400-e29b-41d4-a716-446655440000';

const annualPackage = {
  identifier: '$rc_annual',
  packageType: 'ANNUAL',
  product: {
    identifier: 'com.nmood.realconnections.premium.annual',
    title: 'Nmood Premium (1 Year)',
    priceString: 'AED 299.00',
    currencyCode: 'AED',
    subscriptionPeriod: 'P1Y',
  },
};

const activeEntitlement = {
  entitlements: {
    active: { nmood_premium: { isActive: true, expiresDate: '2027-01-01T00:00:00Z', productIdentifier: 'com.nmood.realconnections.premium.annual' } },
    all: { nmood_premium: { isActive: true, expiresDate: '2027-01-01T00:00:00Z', productIdentifier: 'com.nmood.realconnections.premium.annual' } },
  },
};

const noEntitlement = { entitlements: { active: {}, all: {} } };

let rc;
beforeEach(async () => {
  vi.resetModules();
  Object.values(purchases).forEach((fn) => fn.mockReset());
  purchases.configure.mockResolvedValue(undefined);
  rc = await import('@/lib/revenuecat-client');
  await rc.initializeRevenueCat(USER_ID);
});
afterEach(() => { vi.clearAllMocks(); });

describe('RevenueCat initialization', () => {
  it('configures the SDK with the authenticated Supabase user UUID as the App User ID', () => {
    expect(purchases.configure).toHaveBeenCalledTimes(1);
    expect(purchases.configure.mock.calls[0][0]).toMatchObject({ appUserID: USER_ID, observerMode: false });
  });

  it('refuses to initialize without a user id', async () => {
    await expect(rc.initializeRevenueCat('')).rejects.toMatchObject({ code: 'NO_USER_ID' });
  });
});

describe('Loading products from the live `default` offering', () => {
  it('reads the keyed `all` map returned by getOfferings and keeps the purchasable package', async () => {
    purchases.getOfferings.mockResolvedValue({
      all: { default: { identifier: 'default', availablePackages: [annualPackage] } },
      current: null,
    });

    const products = await rc.getAvailableProducts();

    expect(products).toHaveLength(1);
    expect(products[0]).toMatchObject({
      id: '$rc_annual',
      planId: 'annual',
      productId: 'com.nmood.realconnections.premium.annual',
      price: 'AED 299.00',
    });
    expect(products[0].rcPackage).toBe(annualPackage);
  });

  it('reports unavailable products with a diagnosable code instead of falling back to fake prices', async () => {
    purchases.getOfferings.mockResolvedValue({ all: {}, current: null });
    await expect(rc.getAvailableProducts()).rejects.toMatchObject({ code: 'NO_OFFERINGS' });
  });

  it('reports an offering that exists but has no approved packages', async () => {
    purchases.getOfferings.mockResolvedValue({ all: { default: { identifier: 'default', availablePackages: [] } }, current: null });
    await expect(rc.getAvailableProducts()).rejects.toMatchObject({ code: 'NO_PACKAGES' });
  });
});

describe('Purchasing', () => {
  it('purchases the selected package and reports success only with an active nmood_premium entitlement', async () => {
    purchases.purchasePackage.mockResolvedValue({ productIdentifier: 'x', customerInfo: activeEntitlement });

    const result = await rc.purchasePackage(annualPackage);

    expect(purchases.purchasePackage).toHaveBeenCalledWith({ aPackage: annualPackage });
    expect(result).toMatchObject({ ok: true, isPremium: true });
  });

  it('never activates Premium when the entitlement is not active', async () => {
    purchases.purchasePackage.mockResolvedValue({ productIdentifier: 'x', customerInfo: noEntitlement });

    const result = await rc.purchasePackage(annualPackage);

    expect(result.ok).toBe(false);
    expect(result.isPremium).toBe(false);
    expect(result.code).toBe('ENTITLEMENT_NOT_ACTIVE');
  });

  it('treats a cancelled Apple sheet as a cancellation, not a failure', async () => {
    purchases.purchasePackage.mockRejectedValue({ code: 'PurchaseCancelledError', userCancelled: true, message: 'Purchase was cancelled.' });

    const result = await rc.purchasePackage(annualPackage);

    expect(result).toMatchObject({ ok: false, cancelled: true, code: 'PURCHASE_CANCELLED' });
    expect(result.error).toBeUndefined();
  });

  it('surfaces the real failure reason and error code for a genuine purchase failure', async () => {
    purchases.purchasePackage.mockRejectedValue({ code: '2', message: 'The device is not allowed to make purchases.' });

    const result = await rc.purchasePackage(annualPackage);

    expect(result.ok).toBe(false);
    expect(result.cancelled).toBeUndefined();
    expect(result.error).toBe('The device is not allowed to make purchases.');
    expect(result.code).toBe('2');
  });
});

describe('Restore purchases', () => {
  it('restores an active entitlement', async () => {
    purchases.restorePurchases.mockResolvedValue({ customerInfo: activeEntitlement });
    await expect(rc.restorePurchases()).resolves.toMatchObject({ ok: true, isPremium: true });
  });

  it('reports no active subscription rather than granting Premium', async () => {
    purchases.restorePurchases.mockResolvedValue({ customerInfo: noEntitlement });
    await expect(rc.restorePurchases()).resolves.toMatchObject({ ok: false, isPremium: false });
  });
});

describe('Entitlement reading', () => {
  it('reads nmood_premium out of entitlements.active, including the renewal date and plan', async () => {
    purchases.getCustomerInfo.mockResolvedValue({ customerInfo: activeEntitlement });

    const info = await rc.getCustomerInfo();

    expect(info).toMatchObject({ isPremium: true, plan: 'annual', entitlementId: 'nmood_premium' });
    expect(info.renewalDate).toBe('2027-01-01T00:00:00.000Z');
  });

  it('reports Explorer when there is no active entitlement', async () => {
    purchases.getCustomerInfo.mockResolvedValue({ customerInfo: noEntitlement });
    await expect(rc.getCustomerInfo()).resolves.toMatchObject({ isPremium: false, plan: null });
  });
});
