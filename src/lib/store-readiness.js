// EX-002 — Store Readiness Verification checklist for Apple App Store + Google Play.
// Operational tracking only; no member-facing functionality.

export const STATUSES = ['completed', 'missing', 'needsFounder', 'notApplicable'];

export const STATUS_META = {
  completed: { label: 'Completed', chip: 'bg-success/10 text-success', dot: 'bg-success' },
  missing: { label: 'Missing', chip: 'bg-destructive/10 text-destructive', dot: 'bg-destructive' },
  needsFounder: { label: 'Requires Founder Action', chip: 'bg-warning/10 text-warning', dot: 'bg-warning' },
  notApplicable: { label: 'N/A', chip: 'bg-muted text-muted-foreground', dot: 'bg-muted-foreground' },
};

// Default status reflects what the platform already knows (build secrets/config);
// everything requiring founder-provided assets or accounts defaults to needsFounder.
export const APPLE_ITEMS = [
  { id: 'a_bundle_id', label: 'Bundle Identifier', hint: 'Unique iOS bundle ID configured in Xcode.', default: 'needsFounder', owner: 'Founder' },
  { id: 'a_icon', label: 'App Icon', hint: '1024×1024 master + all required device sizes in asset catalog.', default: 'needsFounder', owner: 'Founder' },
  { id: 'a_adaptive', label: 'Adaptive Icons', hint: 'iOS does not use adaptive icons.', default: 'notApplicable', owner: 'N/A' },
  { id: 'a_splash', label: 'Launch Screen / Splash', hint: 'Storyboard launch screen (Splash page exists in-app).', default: 'needsFounder', owner: 'Founder' },
  { id: 'a_screenshots', label: 'Screenshots', hint: 'App Store screenshots (6.7" + 6.5"/5.5" device sets).', default: 'needsFounder', owner: 'Founder' },
  { id: 'a_feature', label: 'Feature Graphic', hint: 'Not required for App Store listing.', default: 'notApplicable', owner: 'N/A' },
  { id: 'a_description', label: 'Store Description', hint: 'Description (4000 char) + subtitle (30 char). Approved subtitle: "Stop Swiping. Start Living."', default: 'needsFounder', owner: 'Founder' },
  { id: 'a_keywords', label: 'Keywords', hint: '100-character keyword field.', default: 'needsFounder', owner: 'Founder' },
  { id: 'a_age', label: 'Age Rating', hint: 'Age rating questionnaire completed.', default: 'needsFounder', owner: 'Founder' },
  { id: 'a_privacy', label: 'Privacy Labels', hint: 'App Privacy nutrition labels declared.', default: 'needsFounder', owner: 'Founder' },
  { id: 'a_subs', label: 'Subscription Products', hint: 'Auto-renewable subscription products created in App Store Connect.', default: 'needsFounder', owner: 'Founder' },
  { id: 'a_receipt', label: 'Receipt Validation', hint: 'Server-side receipt validation (Apple shared secret not yet set).', default: 'needsFounder', owner: 'Engineering' },
  { id: 'a_account', label: 'Developer Account', hint: 'Apple Developer account + App Store Connect access.', default: 'needsFounder', owner: 'Founder' },
  { id: 'a_internal', label: 'Internal Testing', hint: 'TestFlight internal testing build uploaded.', default: 'needsFounder', owner: 'Founder' },
  { id: 'a_closed', label: 'Closed Testing', hint: 'TestFlight external testing group.', default: 'needsFounder', owner: 'Founder' },
  { id: 'a_production', label: 'Production Release', hint: 'App Store production submission + review.', default: 'missing', owner: 'Founder' },
];

export const GOOGLE_ITEMS = [
  { id: 'g_bundle_id', label: 'Application ID', hint: 'Android applicationId (ANDROID_PACKAGE_NAME secret is set).', default: 'completed', owner: 'Engineering' },
  { id: 'g_icon', label: 'App Icon', hint: '512×512 launcher icon.', default: 'needsFounder', owner: 'Founder' },
  { id: 'g_adaptive', label: 'Adaptive Icons', hint: 'Adaptive icon foreground + background layers.', default: 'needsFounder', owner: 'Founder' },
  { id: 'g_splash', label: 'Splash Screen', hint: 'Android launch theme splash (Splash page exists in-app).', default: 'completed', owner: 'Engineering' },
  { id: 'g_screenshots', label: 'Screenshots', hint: 'Phone screenshots (minimum 2, up to 8).', default: 'needsFounder', owner: 'Founder' },
  { id: 'g_feature', label: 'Feature Graphic', hint: '1024×500 feature graphic banner.', default: 'needsFounder', owner: 'Founder' },
  { id: 'g_description', label: 'Store Description', hint: 'Full description (80 char short + 4000 char full). Approved short: "Stop Swiping. Start Living."', default: 'needsFounder', owner: 'Founder' },
  { id: 'g_keywords', label: 'Keywords', hint: 'Promo text + searchable short description (Google has no keyword field).', default: 'needsFounder', owner: 'Founder' },
  { id: 'g_age', label: 'Age Rating', hint: 'IARC content rating questionnaire.', default: 'needsFounder', owner: 'Founder' },
  { id: 'g_privacy', label: 'Data Safety', hint: 'Data Safety form completed.', default: 'needsFounder', owner: 'Founder' },
  { id: 'g_subs', label: 'Subscription Products', hint: 'Google Play subscription products + base plan offers.', default: 'needsFounder', owner: 'Founder' },
  { id: 'g_receipt', label: 'Receipt Validation', hint: 'Server-side validation + RTDN webhook (SUBSCRIPTION_WEBHOOK_SECRET set).', default: 'needsFounder', owner: 'Engineering' },
  { id: 'g_account', label: 'Developer Account', hint: 'Google Play Developer account.', default: 'needsFounder', owner: 'Founder' },
  { id: 'g_internal', label: 'Internal Testing', hint: 'Internal testing track (up to 100 testers).', default: 'needsFounder', owner: 'Founder' },
  { id: 'g_closed', label: 'Closed Testing', hint: 'Closed testing track (required before production).', default: 'needsFounder', owner: 'Founder' },
  { id: 'g_production', label: 'Production Release', hint: 'Production rollout on Play Console.', default: 'missing', owner: 'Founder' },
];

export const ALL_ITEMS = [...APPLE_ITEMS, ...GOOGLE_ITEMS];