// Store Payments Readiness Inventory — centralized audit of every payment,
// subscription, IAP, entitlement, and billing path in Nmood, mapped to Apple
// App Store and Google Play Store requirements. Based on a full code audit
// (August 2026).
//
// This is an internal readiness aid, NOT an automatic compliance claim.
// All entries are derived from observed code behavior.
//
// MONETIZATION MODEL: Nmood Premium — a DIGITAL subscription that unlocks
// enhanced in-app features (unlimited joins, private messaging, AI Concierge
// without daily limits). Digital subscriptions MUST use Apple In-App Purchase
// on iOS and Google Play Billing on Android. Nmood does NOT sell real-world
// experiences, event tickets, or physical services — all Experiences and
// Circles are free to join and host.
//
// V1 FREE LAUNCH MODE (MONETIZATION_V1 = false): No IAP products, no Apple
// shared secret, no Google service account, no subscription screenshots, and
// no monetization metadata are required for this free build. All member-facing
// features are available at runtime without Membership records. All
// monetization blockers below are reclassified as POST-LAUNCH/FUTURE FEATURE,
// not v1 release blockers. The dormant subscription source code is preserved
// but fails closed and is not exposed in the v1 UI.

// ── Digital vs Physical classification ──────────────────────────────────────
export const MONETIZATION_CLASSIFICATION = {
  nmoodPremium: {
    type: 'DIGITAL SUBSCRIPTION',
    classification: 'Must use Apple IAP on iOS, Google Play Billing on Android',
    description: 'Unlocks unlimited Circle/Experience joins, unlimited connection requests, private messaging, AI Concierge without daily limits',
    canUseExternalPayment: false,
    appleGuideline: 'Guideline 3.1.1 — Apps may not use external payment mechanisms for digital content',
    googlePolicy: 'Google Play Payments policy — digital goods must use Google Play Billing',
  },
  experiences: {
    type: 'REAL-WORLD GATHERING (FREE)',
    classification: 'No payment taken — hosts list for free, members join for free',
    description: 'Person-to-person experiences and gatherings. Nmood does not charge for these.',
    canUseExternalPayment: 'N/A — no payment involved',
  },
  circles: {
    type: 'REAL-WORLD COMMUNITY (FREE)',
    classification: 'No payment taken — organizers create for free, members join for free',
    description: 'Ongoing trusted groups. Nmood does not charge for these.',
    canUseExternalPayment: 'N/A — no payment involved',
  },
};

// ── Proposed Store Product IDs ──────────────────────────────────────────────
// OWNER/APP STORE CONFIGURATION: Product IDs, prices, and localized metadata
// must be created in App Store Connect and Google Play Console by the app
// owner. The IDs below are proposed conventions; they must match exactly
// what is configured in the store dashboards.
export const PROPOSED_PRODUCT_IDS = {
  apple: {
    monthly: {
      productId: 'com.nmood.premium.monthly',
      referenceName: 'Nmood Premium Monthly',
      subscriptionGroup: 'Nmood Premium',
      duration: '1 Month',
      // OWNER/APP STORE CONFIGURATION: Set price tier in App Store Connect
      // Current hardcoded reference: USD 5.00 — NOT authoritative; store price is authoritative
      proposedPriceTier: 'USD 4.99 (Tier 1) — OWNER MUST CONFIRM',
      metadataFields: {
        displayName: 'Nmood Premium Monthly',
        description: 'Unlimited joins, private messaging, and AI Concierge for one month.',
        promotionalText: 'Unlock the full Nmood experience.',
      },
    },
    annual: {
      productId: 'com.nmood.premium.yearly',
      referenceName: 'Nmood Premium Annual',
      subscriptionGroup: 'Nmood Premium',
      duration: '1 Year',
      // OWNER/APP STORE CONFIGURATION: Set price tier in App Store Connect
      // Current hardcoded reference: USD 41.99 — NOT authoritative; store price is authoritative
      proposedPriceTier: 'USD 39.99 (Tier 20) — OWNER MUST CONFIRM',
      metadataFields: {
        displayName: 'Nmood Premium Annual',
        description: 'Unlimited joins, private messaging, and AI Concierge for a full year. Best value.',
        promotionalText: 'Save 40% with the annual plan.',
      },
    },
  },
  google: {
    monthly: {
      productId: 'nmood_premium_monthly',
      subscriptionGroup: 'Nmood Premium',
      duration: 'P1M',
      // OWNER/APP STORE CONFIGURATION: Set base price in Google Play Console
      proposedPriceTier: 'USD 4.99 — OWNER MUST CONFIRM',
      metadataFields: {
        name: 'Nmood Premium Monthly',
        description: 'Unlimited joins, private messaging, and AI Concierge for one month.',
      },
    },
    annual: {
      productId: 'nmood_premium_yearly',
      subscriptionGroup: 'Nmood Premium',
      duration: 'P1Y',
      // OWNER/APP STORE CONFIGURATION: Set base price in Google Play Console
      proposedPriceTier: 'USD 39.99 — OWNER MUST CONFIRM',
      metadataFields: {
        name: 'Nmood Premium Annual',
        description: 'Unlimited joins, private messaging, and AI Concierge for a full year. Best value.',
      },
    },
  },
};

// ── Plans WITHOUT store product IDs (RELEASE BLOCKER) ───────────────────────
// The PLANS array in membership-engine.js defines 5 premium durations, but
// only monthly and annual have product IDs in native-billing-bridge.js.
// Weekly, quarterly, and semiannual CANNOT be purchased through the store
// until product IDs are created and mapped.
export const PLANS_WITHOUT_PRODUCT_IDS = [
  { planId: 'weekly', label: '1 Week', hardcodedPrice: 'USD 3.00', issue: 'No product ID defined in native-billing-bridge.js' },
  { planId: 'quarterly', label: '3 Months', hardcodedPrice: 'USD 12.99', issue: 'No product ID defined in native-billing-bridge.js' },
  { planId: 'semiannual', label: '6 Months', hardcodedPrice: 'USD 23.99', issue: 'No product ID defined in native-billing-bridge.js' },
];

// ── Entitlement lifecycle states ────────────────────────────────────────────
export const ENTITLEMENT_STATES = {
  handled: [
    'active — premium access granted',
    'trial — premium access granted (trial period)',
    'grace_period — premium access maintained during billing retry',
    'expired — reverted to Explorer after expiry',
    'cancelled — voluntary cancellation, premium until period end',
    'refunded — reverted to Explorer immediately',
  ],
  notHandled: [
    'pending — purchase initiated but not completed (deferred payment)',
    'interrupted — App Store/Play Store interrupted the transaction',
    'failed — purchase failed after payment authorization',
    'upgraded — user switched to a higher tier (proration not handled)',
    'downgraded — user switched to a lower tier (effective date not tracked)',
    'family-sharing — Family Sharing eligibility not checked or enforced',
    'offline — no network during purchase/validation (no offline grace)',
  ],
};

// ── Server-side receipt validation ──────────────────────────────────────────
export const RECEIPT_VALIDATION = {
  apple: {
    implemented: true,
    backend: 'base44/functions/subscriptionService/entry.ts',
    verifyUrl: 'https://buy.itunes.apple.com/verifyReceipt',
    sandboxUrl: 'https://sandbox.itunes.apple.com/verifyReceipt',
    sandboxFallback: true, // status 21007 → retry sandbox
    secretRequired: 'APPLE_SHARED_SECRET (NOT SET — RELEASE BLOCKER)',
    fields: ['latest_receipt_info', 'pending_renewal_info', 'cancellation_date_ms', 'auto_renew_status'],
  },
  google: {
    implemented: true,
    backend: 'base44/functions/subscriptionService/entry.ts',
    api: 'Google Play Developer API v3',
    secretRequired: 'GOOGLE_PLAY_SERVICE_ACCOUNT_JSON (NOT SET — RELEASE BLOCKER)',
    packageName: 'ANDROID_PACKAGE_NAME (set to com.nmood.app — OWNER MUST CONFIRM)',
    fields: ['expiryTimeMillis', 'autoRenewing', 'userCancellationTimeMillis', 'paymentState', 'cancelReason'],
  },
  simulationGate: {
    envVar: 'ALLOW_SIMULATED_RECEIPTS',
    productionDefault: 'false (SEC-001A — simulation never enabled in production)',
    description: 'When false, simulated receipts are rejected. Must be explicitly set to "true" for dev/preview.',
  },
};

// ── Webhook / server notification security ──────────────────────────────────
export const WEBHOOK_SECURITY = {
  implemented: true,
  backend: 'base44/functions/subscriptionService/entry.ts (mode: "webhook")',
  authMethod: 'Shared secret in query parameter (?secret=)',
  secretRequired: 'SUBSCRIPTION_WEBHOOK_SECRET (SET)',
  issues: [
    {
      severity: 'RELEASE BLOCKER',
      issue: 'No replay/idempotency protection — the same webhook can be processed multiple times',
      fix: 'Store processed notification IDs and reject duplicates',
    },
    {
      severity: 'MEDIUM',
      issue: 'No cryptographic signature verification — only a shared secret in the URL',
      fix: 'Verify Apple/Google notification signatures (JWS for App Store Server Notifications V2, Google RTDN signatures)',
    },
    {
      severity: 'MEDIUM',
      issue: 'Webhook accepts arbitrary patch object from request body — could allow unintended membership updates',
      fix: 'Derive patch fields from the verified notification payload, not from the request body',
    },
  ],
};

// ── Stripe exposure (DIGITAL GOODS — must NOT be used in native app) ────────
export const STRIPE_EXPOSURE = {
  status: 'NO LIVE STRIPE INTEGRATION — references are interface stubs and dead code',
  classification: 'Digital subscription = must use Apple IAP / Google Play Billing, NOT Stripe',
  appleGuideline: 'Guideline 3.1.1 — In-App Purchase must be used for digital content',
  references: [
    {
      file: 'src/lib/payment-hooks.js',
      issue: 'PAYMENT_PROVIDERS includes a Stripe entry — interface stub only, simulated, never processes real payments',
      action: 'FIXED — Stripe entry removed; only Apple and Google remain',
    },
    {
      file: 'src/lib/membership-engine.js',
      issue: 'upgradeToPremium() defaults provider to "stripe" — legacy function, not used by live purchase flow',
      action: 'FIXED — default changed to "apple"',
    },
    {
      file: 'src/components/membership/MembershipActionsCard.jsx',
      issue: 'restore("stripe") hardcoded — DEAD CODE, not imported by any page',
      action: 'FIXED — uses detectStore() fallback like the live flow',
    },
    {
      file: 'src/components/membership/PremiumManager.jsx',
      issue: 'cancel/restore default to "stripe" — DEAD CODE, not imported by any page',
      action: 'FIXED — uses detectStore() fallback like the live flow',
    },
    {
      file: 'src/lib/consent-config.js',
      issue: 'THIRD_PARTY_PROCESSORS lists Stripe — Nmood does not use Stripe for payments',
      action: 'FIXED — Stripe entry removed from third-party processors',
    },
    {
      file: 'src/lib/app-store-privacy-inventory.js',
      issue: 'Purchases data category lists Stripe as processor — Nmood does not use Stripe',
      action: 'FIXED — processor changed to Apple/Google (in-app purchases) + Base44 (Membership entity)',
    },
  ],
  webCheckoutExposed: false, // no Stripe Checkout, Payment Links, or web payment form exists
  conclusion: 'No Stripe web checkout or external payment link is exposed inside the app. All references are interface stubs or dead code. No Stripe API keys are configured. Stripe is NOT used and NOT needed for digital subscriptions.',
};

// ── Pricing display ──────────────────────────────────────────────────────────
export const PRICING_DISPLAY = {
  currentSource: 'Hardcoded in src/lib/membership-engine.js PLANS array',
  issue: 'Hardcoded prices are displayed as authoritative — App Store/Play Store should provide localized prices',
  appleRequirement: 'Display prices from StoreKit product fetch (SKProduct.priceLocale), not hardcoded values',
  googleRequirement: 'Display prices from BillingClient (SkuDetails.price), not hardcoded values',
  classification: 'RELEASE BLOCKER — hardcoded prices must not be shown as authoritative in native builds',
  fix: 'When native billing bridge is available, fetch and display store-localized prices. Hardcoded prices are dev/preview reference only.',
  autoRenewalDisclosure: 'PASS — Subscription Terms page states auto-renewal clearly',
  trialDisclosure: 'PASS — Subscription Terms page states trial converts to paid unless cancelled',
  legalLinksOnPurchaseScreen: 'PASS — Upgrade.jsx and Membership.jsx both link to Subscription Terms, Refund Policy, Privacy Policy, Terms of Service',
};

// ── Restore Purchases ───────────────────────────────────────────────────────
export const RESTORE_PURCHASES = {
  implemented: true,
  availableOn: ['src/pages/Upgrade.jsx', 'src/pages/Membership.jsx'],
  flow: 'getAvailableReceipts → subscriptionService (mode: restore) → applyEntitlement',
  noLoginTrap: true, // works with current authenticated session, no re-login required
  crossDevice: true, // receipts validated server-side, entitlement applied to current user
  conflictDetection: true, // entitlement_conflict if transaction owned by another user
  classification: 'PASS — visible, functional, no login trap',
};

// ── Manage Subscription ─────────────────────────────────────────────────────
export const MANAGE_SUBSCRIPTION = {
  implemented: true,
  flow: 'openSubscriptionManagement → native settings (Capacitor/WebView) or store URL fallback',
  appleUrl: 'https://apps.apple.com/account/subscriptions',
  googleUrl: 'https://play.google.com/store/account/subscriptions',
  classification: 'PASS — uses platform-supported destination',
};

// ── Account deletion & active subscriptions ──────────────────────────────────
export const ACCOUNT_DELETION_SUBSCRIPTION = {
  behavior: 'Only cancels manual/admin memberships. Apple/Google subscriptions are NOT cancelled (correct — store manages these).',
  userNotification: 'FIXED — DeleteAccountSheet now informs the user that their App Store/Play subscription is NOT cancelled by deleting their Nmood account',
  appleRequirement: 'Guideline 5.1.1(v) — Account deletion must be supported. Deleting Nmood does NOT cancel the store subscription.',
  googleRequirement: 'Play Policy — Account deletion required. Store subscription must be cancelled separately.',
  classification: 'FIXED IN DEVELOPMENT — user is now informed',
};

// ── Secrets needed ──────────────────────────────────────────────────────────
export const SECRETS_NEEDED = [
  {
    name: 'APPLE_SHARED_SECRET',
    status: 'NOT SET — RELEASE BLOCKER',
    description: 'Apple App Store shared secret for verifyReceipt validation. Obtain from App Store Connect → App → App Information → Shared Secret.',
  },
  {
    name: 'GOOGLE_PLAY_SERVICE_ACCOUNT_JSON',
    status: 'NOT SET — RELEASE BLOCKER',
    description: 'Google Play service account JSON for Play Developer API access. Create in Google Cloud Console, grant Android Publisher access, download JSON key.',
  },
  {
    name: 'ALLOW_SIMULATED_RECEIPTS',
    status: 'NOT SET (correct for production)',
    description: 'Set to "true" ONLY in dev/preview to exercise the full purchase flow with simulated receipts. Must NEVER be set in production.',
  },
  {
    name: 'SUBSCRIPTION_WEBHOOK_SECRET',
    status: 'SET',
    description: 'Shared secret for webhook authentication. Already configured.',
  },
  {
    name: 'ANDROID_PACKAGE_NAME',
    status: 'SET (com.nmood.app — OWNER MUST CONFIRM)',
    description: 'Android package name for Google Play API calls. Must match the package registered in Google Play Console.',
  },
];

// ── Release gate ────────────────────────────────────────────────────────────
export const RELEASE_GATE = {
  implemented: true,
  location: 'src/lib/native-billing-bridge.js (isNativeBillingAvailable) + subscriptionService backend (ALLOW_SIMULATED_RECEIPTS)',
  behavior: 'When no native billing bridge is present (web/preview), purchaseProduct returns a simulated receipt. The backend rejects simulated receipts unless ALLOW_SIMULATED_RECEIPTS=true. In a native production build, the native bridge is present and real store sheets are launched.',
  gap: 'The client-side simulated receipt is still generated in web/preview. A UI release gate should prevent the purchase button from appearing to function in a production native build without a native bridge.',
  classification: 'PASS — backend rejects simulated receipts in production; client gate added to PremiumPlans',
};

// ── Controlled sandbox tests ────────────────────────────────────────────────
export const CONTROLLED_SANDBOX_TESTS = [
  'Apple Sandbox: Purchase monthly subscription with sandbox tester account → verify receipt validation → entitlement granted',
  'Apple Sandbox: Purchase annual subscription with sandbox tester account → verify receipt validation → entitlement granted',
  'Apple Sandbox: Cancel subscription → verify cancellation_date_ms → entitlement remains until expiry → reverts to Explorer',
  'Apple Sandbox: Refund via StoreKit → verify cancellation → entitlement reverts immediately',
  'Apple Sandbox: Grace period → verify grace_period_expires_date_ms → premium maintained during retry',
  'Apple Sandbox: Restore purchases on new device → verify cross-device entitlement',
  'Apple Sandbox: Attempt duplicate purchase → verify entitlement_conflict rejection',
  'Google Play: Purchase monthly with license testing account → verify token validation → entitlement granted',
  'Google Play: Cancel subscription → verify userCancellationTimeMillis → entitlement remains until expiry',
  'Google Play: Refund via Play Console → verify cancelReason → entitlement reverts',
  'Google Play: Grace period (paymentState=3) → premium maintained during retry',
  'Google Play: Restore purchases → verify cross-device entitlement',
  'Web/Preview: ALLOW_SIMULATED_RECEIPTS=true → simulated purchase → entitlement granted → verify welcome flow',
  'Web/Preview: ALLOW_SIMULATED_RECEIPTS=false → simulated purchase → backend rejects → neutral error',
];

// ── Physical device tests required ─────────────────────────────────────────
export const PHYSICAL_DEVICE_TESTS = [
  'iOS: Real IAP purchase sheet appears when Continue button is tapped (not a web form)',
  'iOS: Price displayed matches the App Store Connect price tier (not hardcoded)',
  'iOS: Restore Purchases works without re-login',
  'iOS: Manage Subscription opens Apple Settings → Nmood subscription',
  'iOS: Deleting Nmood account does NOT cancel the Apple subscription (user is informed)',
  'iOS: Subscription Terms and Privacy Policy links open from the purchase screen',
  'Android: Real Play Billing sheet appears when Continue button is tapped',
  'Android: Price displayed matches the Google Play Console base price (not hardcoded)',
  'Android: Restore Purchases works without re-login',
  'Android: Manage Subscription opens Google Play Subscriptions → Nmood',
  'Android: Deleting Nmood account does NOT cancel the Google subscription (user is informed)',
  'Android: Subscription Terms and Privacy Policy links open from the purchase screen',
];

// ── Release blockers ────────────────────────────────────────────────────────
export const PAYMENTS_RELEASE_BLOCKERS = [
  {
    item: 'APPLE_SHARED_SECRET secret not set',
    severity: 'BLOCKER',
    reason: 'Apple receipt validation fails without the shared secret. Premium cannot be granted from real App Store purchases.',
  },
  {
    item: 'GOOGLE_PLAY_SERVICE_ACCOUNT_JSON secret not set',
    severity: 'BLOCKER',
    reason: 'Google Play API calls fail without the service account. Premium cannot be granted from real Google Play purchases.',
  },
  {
    item: 'Store product IDs not created in App Store Connect / Google Play Console',
    severity: 'BLOCKER',
    reason: 'com.nmood.premium.monthly, com.nmood.premium.yearly, nmood_premium_monthly, nmood_premium_yearly must be created with prices and metadata by the app owner.',
  },
  {
    item: 'Hardcoded prices shown as authoritative',
    severity: 'BLOCKER',
    reason: 'PLANS array prices (USD 5.00, USD 41.99, etc.) are displayed as the real price. Store-localized prices must be fetched and displayed in native builds.',
  },
  {
    item: 'Webhook replay/idempotency protection missing',
    severity: 'BLOCKER',
    reason: 'subscriptionService webhook mode has no deduplication. Duplicate webhook deliveries could double-process renewals/cancellations.',
  },
  {
    item: 'Weekly/Quarterly/Semiannual plans have no store product IDs',
    severity: 'BLOCKER',
    reason: '3 of 5 premium plans cannot be purchased through the store. Either create product IDs for all plans or remove un-purchasable plans from the UI.',
  },
  {
    item: 'Native billing bridge (Capacitor/StoreKit/Play Billing) not wired',
    severity: 'BLOCKER',
    reason: 'native-billing-bridge.js detects a bridge but no native plugin is installed. A Capacitor IAP plugin or custom StoreKit/Play Billing wrapper must be integrated for the native app.',
  },
];

// ── Owner decisions needed ──────────────────────────────────────────────────
export const OWNER_DECISIONS_NEEDED = [
  {
    decision: 'Confirm subscription pricing tiers',
    details: 'App Store Connect and Google Play Console price tiers must be set by the owner. Proposed: monthly USD 4.99, annual USD 39.99. Current hardcoded values (USD 5.00, USD 41.99) are NOT authoritative.',
  },
  {
    decision: 'Confirm which plans to offer at launch',
    details: '5 plans are defined (weekly, monthly, quarterly, semiannual, annual) but only 2 have product IDs. Owner must decide: create all 5 in the stores, or reduce to monthly + annual only.',
  },
  {
    decision: 'Confirm Android package name',
    details: 'ANDROID_PACKAGE_NAME is set to com.nmood.app. Owner must confirm this matches the Google Play Console registration.',
  },
  {
    decision: 'Confirm Apple bundle ID',
    details: 'Apple product IDs use com.nmood.premium.* — owner must confirm the bundle ID prefix matches the App Store Connect app.',
  },
  {
    decision: 'Confirm no Stripe/web checkout is needed',
    details: 'Nmood does not sell physical goods or services. All monetization is digital subscription. Stripe is NOT needed. Owner must confirm this is the final model.',
  },
];

// ── Summary ─────────────────────────────────────────────────────────────────
export const PAYMENTS_SUMMARY = {
  monetizationModel: 'Nmood Premium — digital subscription (Explorer free, Premium paid)',
  digitalClassification: 'Digital subscription — must use Apple IAP / Google Play Billing',
  stripeExposure: 'No live Stripe integration — references are interface stubs and dead code, now cleaned up',
  entitlementSourceOfTruth: 'Membership entity (server-side, via subscriptionService backend)',
  serverSideValidation: 'Implemented for Apple and Google — secrets not yet configured',
  restorePurchases: 'Implemented — visible, functional, no login trap',
  manageSubscription: 'Implemented — platform-supported destination',
  accountDeletionNotice: 'Fixed — user informed that store subscription is NOT cancelled',
  releaseGate: 'Backend rejects simulated receipts in production; client gate added',
  legalLinksOnPurchaseScreen: 'Present — Subscription Terms, Refund Policy, Privacy Policy, Terms of Service',
  classification: 'NOT READY FOR NATIVE PRODUCTION — secrets, product IDs, native bridge, and store-localized pricing required',
};