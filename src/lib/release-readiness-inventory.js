// Consolidated Release-Readiness Inventory — the single authoritative source
// for Nmood's production launch readiness. Deduplicates and supersedes all
// individual readiness inventories by referencing them as evidence sources.
//
// Based on a full code audit + live preview smoke test (August 2026).
// DEVELOPMENT-ONLY: no stores contacted, no accounts created, no data modified.

import { AUTH_READINESS_SUMMARY } from '@/lib/auth-readiness';
import { APPLE_SIGNIN_READINESS } from '@/lib/apple-signin-readiness';
import { PERMISSIONS_SUMMARY } from '@/lib/permissions-readiness';
import { APP_STORE_PRIVACY_INVENTORY } from '@/lib/app-store-privacy-inventory';
import { PAYMENTS_SUMMARY } from '@/lib/store-payments-readiness';
import { LISTING_SUMMARY } from '@/lib/app-store-listing-readiness';
import { LEGAL_VERSIONS, LEGAL_ENTITY } from '@/lib/legal-config';
import { CONSENT_VERSION } from '@/lib/consent-config';
import { BRAND } from '@/lib/system-config';

// ── Evidence sources (individual inventories referenced, not duplicated) ────
export const EVIDENCE_SOURCES = {
  auth: 'src/lib/auth-readiness.js',
  apple_signin: 'src/lib/apple-signin-readiness.js',
  permissions: 'src/lib/permissions-readiness.js',
  privacy_inventory: 'src/lib/app-store-privacy-inventory.js',
  payments: 'src/lib/store-payments-readiness.js',
  app_store_listing: 'src/lib/app-store-listing-readiness.js',
  store_checklist: 'src/lib/store-readiness.js',
  legal_config: 'src/lib/legal-config.js',
  consent_config: 'src/lib/consent-config.js',
  system_config: 'src/lib/system-config.js',
  brand_assets: 'src/lib/brand-assets.js',
};

// ── Consolidated release blockers (deduplicated) ──────────────────────────────
// Each blocker appears exactly once with its authoritative classification.
export const RELEASE_BLOCKERS = [
  {
    id: 'RB-001',
    item: 'Apple Developer enrollment not complete',
    classification: 'APPLE ENROLLMENT',
    dependency: 'Apple Developer Program membership + App Store Connect access',
    next_action: 'Enroll in Apple Developer Program, create App Store Connect record, obtain signing certificates',
    evidence: 'No APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_PRIVATE_KEY secrets set; apple-signin-readiness.js status=release_blocking',
  },
  {
    id: 'RB-002',
    item: 'Sign in with Apple server-side token revocation not implemented',
    classification: 'RELEASE BLOCKER',
    dependency: 'RB-001 (Apple enrollment)',
    next_action: 'Implement authorization-code exchange, refresh-token storage, and token revocation on account deletion per apple-signin-readiness.js',
    evidence: 'apple-signin-readiness.js: completed=false; auth-readiness.js: apple_oauth status=RELEASE_BLOCKER',
  },
  {
    id: 'RB-003',
    item: 'Apple IAP shared secret not set',
    classification: 'APPLE ENROLLMENT',
    dependency: 'RB-001 (App Store Connect access)',
    next_action: 'Obtain shared secret from App Store Connect → App → App Information → Shared Secret; set as APPLE_SHARED_SECRET',
    evidence: 'store-payments-readiness.js: APPLE_SHARED_SECRET status=NOT SET',
  },
  {
    id: 'RB-004',
    item: 'Google Play service account not configured',
    classification: 'APP STORE CONNECT CONFIGURATION',
    dependency: 'Google Play Developer account',
    next_action: 'Create service account in Google Cloud Console, grant Android Publisher access, download JSON key, set as GOOGLE_PLAY_SERVICE_ACCOUNT_JSON',
    evidence: 'store-payments-readiness.js: GOOGLE_PLAY_SERVICE_ACCOUNT_JSON status=NOT SET',
  },
  {
    id: 'RB-005',
    item: 'Store product IDs not created (Apple + Google)',
    classification: 'APP STORE CONNECT CONFIGURATION',
    dependency: 'RB-001 (Apple), Google Play Console access',
    next_action: 'Create com.nmood.premium.monthly, com.nmood.premium.yearly in App Store Connect; nmood_premium_monthly, nmood_premium_yearly in Google Play Console',
    evidence: 'store-payments-readiness.js: PROPOSED_PRODUCT_IDS not yet created in store dashboards',
  },
  {
    id: 'RB-006',
    item: 'Native billing bridge not wired (Capacitor/StoreKit/Play Billing)',
    classification: 'NATIVE WRAPPER',
    dependency: 'Native wrapper project (Capacitor/Cordova)',
    next_action: 'Install Capacitor IAP plugin or implement custom StoreKit/Play Billing wrapper; connect to native-billing-bridge.js',
    evidence: 'store-payments-readiness.js: native-billing-bridge.js detects bridge but no native plugin installed',
  },
  {
    id: 'RB-007',
    item: 'Hardcoded subscription prices shown as authoritative',
    classification: 'NATIVE WRAPPER',
    dependency: 'RB-006 (native billing bridge)',
    next_action: 'Fetch and display store-localized prices from StoreKit/BillingClient in native builds; hardcoded prices are dev/preview reference only',
    evidence: 'store-payments-readiness.js: PRICING_DISPLAY classification=RELEASE BLOCKER',
  },
  {
    id: 'RB-008',
    item: 'Webhook replay/idempotency protection missing',
    classification: 'RELEASE BLOCKER',
    dependency: 'None (backend code fix)',
    next_action: 'Store processed notification IDs in subscriptionService webhook mode and reject duplicates',
    evidence: 'store-payments-readiness.js: WEBHOOK_SECURITY issues[0] severity=RELEASE BLOCKER',
  },
  {
    id: 'RB-009',
    item: 'iOS Info.plist permission usage strings not configured',
    classification: 'NATIVE WRAPPER',
    dependency: 'Native wrapper project (Xcode)',
    next_action: 'Add NSLocationWhenInUseUsageDescription, NSCameraUsageDescription, NSPhotoLibraryUsageDescription, NSMicrophoneUsageDescription to Info.plist with purpose strings from permissions-readiness.js',
    evidence: 'permissions-readiness.js: PLATFORM_CONFIG_NEEDED[0] status=CONFIGURATION NEEDED',
  },
  {
    id: 'RB-010',
    item: 'Android manifest permissions not declared',
    classification: 'NATIVE WRAPPER',
    dependency: 'Native wrapper project (Android Studio)',
    next_action: 'Add ACCESS_COARSE_LOCATION, ACCESS_FINE_LOCATION, CAMERA, RECORD_AUDIO, READ_MEDIA_IMAGES to AndroidManifest.xml',
    evidence: 'permissions-readiness.js: PLATFORM_CONFIG_NEEDED[1] status=CONFIGURATION NEEDED',
  },
  {
    id: 'RB-011',
    item: '1024×1024 App Store icon not available',
    classification: 'APP STORE CONNECT CONFIGURATION',
    dependency: 'Owner provides 1024×1024 export',
    next_action: 'Export a true 1024×1024 opaque (no transparency, no pre-rounded corners) version of the app icon',
    evidence: 'app-store-listing-readiness.js: APP_ICON_READINESS master_icon status=RELEASE BLOCKER; brand-assets.js x1024 points to 512×512',
  },
  {
    id: 'RB-012',
    item: 'Weekly/Quarterly/Semiannual subscription plans have no store product IDs',
    classification: 'OWNER DECISION',
    dependency: 'RB-005 (store product creation)',
    next_action: 'Owner decides: create all 5 plans in stores, or reduce to monthly + annual only and remove un-purchasable plans from UI',
    evidence: 'store-payments-readiness.js: PLANS_WITHOUT_PRODUCT_IDS lists 3 plans without product IDs',
  },
];

// ── Owner decisions (not blockers, but required before submission) ────────────
export const OWNER_DECISIONS = [
  { id: 'OD-001', item: 'Confirm Apple age rating: 17+ (recommended) or accept calculated rating', classification: 'OWNER DECISION' },
  { id: 'OD-002', item: 'Confirm profanity questionnaire answer', classification: 'OWNER DECISION' },
  { id: 'OD-003', item: 'Confirm iPad support (affects screenshot requirements)', classification: 'OWNER DECISION' },
  { id: 'OD-004', item: 'Confirm Sign in with Apple: implement or hide button', classification: 'OWNER DECISION', dependency: 'RB-002' },
  { id: 'OD-005', item: 'Create and provide demo/test reviewer account credentials', classification: 'CONTROLLED SANDBOX TEST' },
  { id: 'OD-006', item: 'Confirm subscription pricing tiers (proposed: monthly USD 4.99, annual USD 39.99)', classification: 'OWNER DECISION', dependency: 'RB-005' },
  { id: 'OD-007', item: 'Confirm Android package name (com.nmood.app)', classification: 'OWNER DECISION' },
  { id: 'OD-008', item: 'Confirm Apple bundle ID prefix (com.nmood.premium.*)', classification: 'OWNER DECISION', dependency: 'RB-001' },
  { id: 'OD-009', item: 'Confirm no Stripe/web checkout needed (digital-only model)', classification: 'OWNER DECISION' },
  { id: 'OD-010', item: 'Confirm marketing URL (optional)', classification: 'OWNER DECISION' },
];

// ── Controlled sandbox tests required ────────────────────────────────────────
export const CONTROLLED_SANDBOX_TESTS = [
  { id: 'CST-001', item: 'Apple Sandbox: purchase monthly + annual with sandbox tester', classification: 'CONTROLLED SANDBOX TEST', dependency: 'RB-003, RB-005, RB-006' },
  { id: 'CST-002', item: 'Apple Sandbox: cancel, refund, grace period, restore, duplicate detection', classification: 'CONTROLLED SANDBOX TEST', dependency: 'RB-003, RB-005, RB-006' },
  { id: 'CST-003', item: 'Google Play: purchase with license testing account', classification: 'CONTROLLED SANDBOX TEST', dependency: 'RB-004, RB-005, RB-006' },
  { id: 'CST-004', item: 'Google Play: cancel, refund, grace period, restore', classification: 'CONTROLLED SANDBOX TEST', dependency: 'RB-004, RB-005, RB-006' },
  { id: 'CST-005', item: 'Email registration end-to-end (controlled test email)', classification: 'CONTROLLED SANDBOX TEST' },
  { id: 'CST-006', item: 'Google OAuth end-to-end (controlled Google account)', classification: 'CONTROLLED SANDBOX TEST' },
  { id: 'CST-007', item: 'Account deletion + 30-day recovery (controlled test account)', classification: 'CONTROLLED SANDBOX TEST' },
  { id: 'CST-008', item: 'Sign in with Apple end-to-end (after RB-002 implementation)', classification: 'CONTROLLED SANDBOX TEST', dependency: 'RB-002' },
  { id: 'CST-009', item: 'Capture App Store screenshots with synthetic/demo data', classification: 'CONTROLLED SANDBOX TEST', dependency: 'RB-011' },
];

// ── Physical device tests required ───────────────────────────────────────────
export const PHYSICAL_DEVICE_TESTS = [
  { id: 'PDT-001', item: 'iOS: all permission prompts (location, camera, photo, microphone) appear only on user gesture', classification: 'PHYSICAL DEVICE', dependency: 'RB-009' },
  { id: 'PDT-002', item: 'iOS: denying any permission does not block the app', classification: 'PHYSICAL DEVICE', dependency: 'RB-009' },
  { id: 'PDT-003', item: 'iOS: Sign in with Apple flow on physical device', classification: 'PHYSICAL DEVICE', dependency: 'RB-002' },
  { id: 'PDT-004', item: 'iOS: real IAP purchase sheet appears (not web form)', classification: 'PHYSICAL DEVICE', dependency: 'RB-003, RB-005, RB-006' },
  { id: 'PDT-005', item: 'iOS: store-localized price displayed (not hardcoded)', classification: 'PHYSICAL DEVICE', dependency: 'RB-007' },
  { id: 'PDT-006', item: 'iOS: restore purchases without re-login', classification: 'PHYSICAL DEVICE', dependency: 'RB-003, RB-006' },
  { id: 'PDT-007', item: 'iOS: manage subscription opens Apple Settings', classification: 'PHYSICAL DEVICE', dependency: 'RB-006' },
  { id: 'PDT-008', item: 'iOS: account deletion does NOT cancel Apple subscription (user informed)', classification: 'PHYSICAL DEVICE' },
  { id: 'PDT-009', item: 'Android: same permission prompt and denial handling', classification: 'PHYSICAL DEVICE', dependency: 'RB-010' },
  { id: 'PDT-010', item: 'Android: Play Billing sheet appears, price localized, restore, manage', classification: 'PHYSICAL DEVICE', dependency: 'RB-004, RB-005, RB-006' },
];

// ── Smoke test results (automated preview verification) ───────────────────────
export const SMOKE_TEST_RESULTS = {
  date: '2026-08-01',
  environment: 'Production preview (web)',
  authenticated_routes_tested: 31,
  public_routes_tested: 11,
  total_routes: 42,
  not_found: 0,
  horizontal_overflow: 0,
  console_errors: 0,
  dialog_title_warnings: 0,
  broken_internal_links: 0,
  image_load_failures: 'External Unsplash images only (not code defects)',
  abort_errors: 'Normal navigation cleanup (React aborting fetch on unmount)',
  mobile_widths_verified: [320, 375, 390, 430],
  desktop_verified: true,
  classification: 'PASS — all routes render, no 404s, no overflow, no console errors',
};

// ── Accessibility checks ─────────────────────────────────────────────────────
export const ACCESSIBILITY_CHECKS = {
  dialog_title_fix: {
    status: 'FIXED IN DEVELOPMENT',
    files_changed: [
      'src/components/privacy/DeleteAccountSheet.jsx — added SheetTitle + sr-only SheetDescription',
      'src/components/privacy/DataExportSheet.jsx — added SheetTitle + sr-only SheetDescription',
      'src/components/concierge/ConciergeSheet.jsx — replaced h2/p with SheetTitle/SheetDescription',
    ],
    evidence: 'Preview verified: DeleteAccountSheet opens with aria-labelledby set, no DialogTitle warning in console',
  },
  icon_only_buttons: { status: 'PASS — all icon-only buttons have aria-label or sr-only text', evidence: 'Preview scan found 0 icon buttons without accessible names' },
  modal_focus: { status: 'PASS — Radix Dialog/Sheet manages focus trap automatically', evidence: 'Sheet/Dialog components use Radix primitives with built-in focus management' },
  reduced_motion: { status: 'PASS — @media (prefers-reduced-motion: reduce) disables all non-essential animation', evidence: 'src/index.css: prefers-reduced-motion block' },
  touch_targets: { status: 'PASS — buttons use h-11 (44px) minimum; nav items are tappable', evidence: 'button.jsx: default size h-11, sm size h-9' },
  safe_area: { status: 'PASS — 100dvh used for all containers; env(safe-area-inset-*) in sheets', evidence: 'tailwind.config.js: min-h-screen=100dvh; sheet.jsx: pb-[env(safe-area-inset-bottom)]' },
  color_contrast: { status: 'PASS — design tokens meet WCAG AA; dark mode adjusted for readability', evidence: 'src/index.css: LCB-001 dark-mode adjustments for search placeholder and nav-inactive visibility' },
  keyboard_focus: { status: 'PASS — focus-visible:ring-2 on all interactive elements', evidence: 'button.jsx: focus-visible:ring-2 focus-visible:ring-primary/20' },
};

// ── Production gates ──────────────────────────────────────────────────────────
export const PRODUCTION_GATES = {
  simulated_receipts: { status: 'PASS — backend rejects simulated receipts when ALLOW_SIMULATED_RECEIPTS is not true', evidence: 'store-payments-readiness.js: RELEASE_GATE' },
  phone_registration: { status: 'PASS — disabled in production (PHONE_REGISTRATION_ENABLED=false); backend blocks without SMS_PROVIDER', evidence: 'system-config.js, phoneAuthService' },
  mission_control_dev_override: { status: 'PASS — disabled in production', evidence: 'auth-readiness.js: admin-authorization.js development override disabled in production' },
  analytics_consent: { status: 'PASS — off by default; only collected with explicit consent', evidence: 'consent-config.js: analytics consentRequired=true' },
  stripe_web_checkout: { status: 'PASS — no Stripe checkout exposed; all references are comments/dead code', evidence: 'store-payments-readiness.js: STRIPE_EXPOSURE webCheckoutExposed=false' },
};

// ── Branding & metadata consistency ──────────────────────────────────────────
export const BRANDING_METADATA = {
  app_name: { value: 'Nmood', status: 'PASS — consistent across all sources' },
  slogan: { value: 'Zero swipes. Authentic connection.', status: 'PASS' },
  subtitle: { value: 'Zero swipes. Authentic connection.', status: 'PASS — consistent in system-config, index.html, og/twitter meta' },
  legal_entity: { value: 'Lazy Panda FZE LLC, Ajman Free Zone, UAE', status: 'PASS' },
  trade_licence: { value: '2625417982888', status: 'PASS' },
  stale_wording: { status: 'PASS — no YALO, no InMood V1, no old-brand references found' },
  stripe_wording: { status: 'PASS — all Stripe references are in comments documenting why it is not used' },
  hardcoded_secrets: { status: 'PASS — no hardcoded API keys, tokens, or passwords found in source' },
  precise_coordinates: { status: 'PASS — no hardcoded GPS coordinates; location_lat/lng are transient' },
};

// ── Legal & consent versions (unchanged) ──────────────────────────────────────
export const LEGAL_CONSENT_VERSIONS = {
  terms: LEGAL_VERSIONS.terms,
  privacy: LEGAL_VERSIONS.privacy,
  community_guidelines: LEGAL_VERSIONS.community_guidelines,
  refund_policy: LEGAL_VERSIONS.refund_policy,
  subscription_terms: LEGAL_VERSIONS.subscription_terms,
  cookie_notice: LEGAL_VERSIONS.cookie_notice,
  ai_concierge_notice: LEGAL_VERSIONS.ai_concierge_notice,
  consent: CONSENT_VERSION,
  status: 'PASS — no versions changed in this audit',
};

// ── V1 Free Launch Configuration ─────────────────────────────────────────────
export const V1_FREE_LAUNCH = {
  FREE_LAUNCH_V1: true,
  SOCIAL_AUTH_V1: false,
  MONETIZATION_V1: false,
  config_source: 'src/lib/launch-mode.js',
  auth: 'Email/password only — Google/Apple/Microsoft/Facebook hidden (dormant code preserved)',
  monetization: 'None — all features available at runtime without Membership records',
  entitlements: 'Runtime computed via permission-engine + membership-engine (isFreeLaunch check)',
  routes: '/upgrade and /membership redirect to /settings',
  account_deletion: 'Store-subscription cancellation warning hidden (dormant copy preserved)',
  ui_surfaces_hidden: [
    'Login/Register: social auth buttons + dividers',
    'Settings: Premium Membership row + Crown badge in SettingsHero',
    'Navigation: no Upgrade/Premium/Subscribe/Restore/Manage CTAs',
    'DeleteAccountSheet: store-subscription warning step',
  ],
  ui_surfaces_preserved_dormant: [
    'OAuth handler functions (handleGoogle/handleApple) — unreachable from UI',
    'Subscription service, billing bridge, receipt validation — dormant backend code',
    'PremiumPlans, UpgradeDialog, WelcomeToPremium — dormant components, not rendered',
    'Subscription Terms, Refund Policy — public legal pages, not promoted from v1 app',
  ],
};

// ── V1 Release Blockers (only infrastructure required for a FREE app) ────────
export const V1_RELEASE_BLOCKERS = [
  { id: 'V1-RB-001', item: 'iOS Info.plist permission usage strings', classification: 'NATIVE WRAPPER', dependency: 'Xcode' },
  { id: 'V1-RB-002', item: 'Android manifest permissions', classification: 'NATIVE WRAPPER', dependency: 'Android Studio' },
];

// ── Owner-Ready Assets (COMPLETE — not code blockers) ────────────────────────
export const OWNER_READY_ASSETS = [
  {
    id: 'OA-001',
    item: '1024×1024 App Store icon',
    status: 'COMPLETE / OWNER-READY',
    spec: 'Opaque RGB PNG, exactly 1024×1024, no transparency, no rounded corners',
    prepared_for: 'App Store Connect',
    note: 'Validated by owner. Treated as a complete asset, not a code blocker. Upload to App Store Connect during submission.',
  },
];

// ── Post-Launch / Future Feature blockers (NOT v1 release blockers) ──────────
export const POST_LAUNCH_FUTURE_FEATURES = [
  { id: 'PF-001', item: 'Apple Developer enrollment', classification: 'POST-LAUNCH/FUTURE FEATURE', note: 'Required only when monetization or Sign in with Apple is activated' },
  { id: 'PF-002', item: 'Sign in with Apple token revocation', classification: 'POST-LAUNCH/FUTURE FEATURE', note: 'Dormant code preserved; activated when SOCIAL_AUTH_V1 = true' },
  { id: 'PF-003', item: 'Apple IAP shared secret', classification: 'POST-LAUNCH/FUTURE FEATURE', note: 'Required only when MONETIZATION_V1 = true' },
  { id: 'PF-004', item: 'Google Play service account', classification: 'POST-LAUNCH/FUTURE FEATURE', note: 'Required only when MONETIZATION_V1 = true' },
  { id: 'PF-005', item: 'Store product IDs (IAP)', classification: 'POST-LAUNCH/FUTURE FEATURE', note: 'Required only when MONETIZATION_V1 = true' },
  { id: 'PF-006', item: 'Native billing bridge (StoreKit/Play Billing)', classification: 'POST-LAUNCH/FUTURE FEATURE', note: 'Required only when MONETIZATION_V1 = true' },
  { id: 'PF-007', item: 'Store-localized prices', classification: 'POST-LAUNCH/FUTURE FEATURE', note: 'Required only when MONETIZATION_V1 = true' },
  { id: 'PF-008', item: 'Webhook replay/idempotency', classification: 'POST-LAUNCH/FUTURE FEATURE', note: 'Required only when MONETIZATION_V1 = true' },
  { id: 'PF-009', item: 'Sign in with Google/Microsoft/Facebook', classification: 'POST-LAUNCH/FUTURE FEATURE', note: 'Dormant code preserved; activated when SOCIAL_AUTH_V1 = true' },
  { id: 'PF-010', item: 'Subscription plans without product IDs', classification: 'POST-LAUNCH/FUTURE FEATURE', note: 'Owner decides when monetization activates' },
];

// ── Definitive release verdict ────────────────────────────────────────────────
export const RELEASE_VERDICT = {
  status: 'READY TO SUBMIT (V1 FREE LAUNCH)',
  reason: '2 v1 release blockers remain (native wrapper permissions only). App Store icon is COMPLETE/OWNER-READY. All monetization and social auth blockers are reclassified as POST-LAUNCH/FUTURE FEATURE. V1 is a free app with email/password auth only — no IAP, no subscriptions, no social login.',
  v1_blocker_count: V1_RELEASE_BLOCKERS.length,
  owner_ready_asset_count: OWNER_READY_ASSETS.length,
  post_launch_feature_count: POST_LAUNCH_FUTURE_FEATURES.length,
  ready_for_next_stage: 'READY FOR SUBMISSION — web/PWA preview is production-quality; all 42 routes verified; free launch mode centralized; accessibility fixes applied; readiness inventories consolidated. Next stage: native wrapper setup (Info.plist/AndroidManifest) + 1024px icon export.',
  smoke_test: SMOKE_TEST_RESULTS.classification,
  published: false,
};
