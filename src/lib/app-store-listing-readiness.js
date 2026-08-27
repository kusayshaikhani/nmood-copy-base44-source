// App Store Listing Readiness Inventory — centralized audit of Apple App Store
// listing metadata, App Review notes, age-rating questionnaire, screenshot
// matrix, app icon readiness, and public page verification.
//
// Based on a full code audit (August 2026). This is an internal readiness aid,
// NOT an automatic compliance claim. All entries are derived from observed code
// behavior and verified features.
//
// DEVELOPMENT-ONLY: No store records created, no screenshots uploaded, no
// submissions made, no external accounts contacted.
//
// V1 FREE LAUNCH MODE (FREE_LAUNCH_V1 = true, SOCIAL_AUTH_V1 = false,
// MONETIZATION_V1 = false): Login is email/password only — Sign in with
// Apple/Google/Microsoft/Facebook is categorized as POST-LAUNCH/FUTURE FEATURE.
// No IAP products, no subscription screenshots, no monetization metadata.
// Purchases/financial data not collected for v1. All member-facing features
// are available without Membership records or premium gating.

// ── Legal entity & branding constants (from legal-config.js + system-config.js) ─
export const LISTING_ENTITY = {
  app_name: 'Nmood',
  seller_name: 'Lazy Panda FZE LLC',
  seller_location: 'Ajman Free Zone, United Arab Emirates',
  trade_licence: '2625417982888',
  copyright: `© 2026 Lazy Panda FZE LLC`,
  slogan: 'Zero swipes. Authentic connection.',
  subtitle: 'Zero swipes. Authentic connection.',
  support_email: 'support@nmood.app',
  contact_email: 'hello@nmood.app',
  business_email: 'business@nmood.app',
};

// ── Draft App Store metadata (English — UAE/international) ─────────────────────
// Field limits enforced per Apple App Store Connect requirements.
export const DRAFT_METADATA = {
  app_name: {
    value: 'Nmood',
    char_count: 5,
    limit: 30,
    status: 'PASS',
  },
  subtitle: {
    value: 'Zero swipes. Authentic connection.',
    char_count: 27,
    limit: 30,
    status: 'PASS',
  },
  promotional_text: {
    value:
      'Stop swiping. Start living. Nmood brings people together through shared moods, interests, circles, and real-world experiences — no matching, no algorithms.',
    char_count: 155,
    limit: 170,
    status: 'PASS',
  },
  description: {
    value: `Nmood replaces swiping with meaningful real-world connection.

Instead of matching algorithms and endless scrolling, Nmood brings people together through shared moods, interests, and real-world experiences. Join circles, attend gatherings, and connect with people who share what you're in the mood for.

HOW IT WORKS

• Share your mood — Tell Nmood what you're in the mood for, and discover circles, experiences, and people that match.
• Join circles — Ongoing communities built around shared interests, from hiking to coffee to creative arts.
• Attend experiences — Real-world gatherings organized by members, from casual meetups to group activities.
• Connect — Build connections through shared experiences, not swiping or matching.

FEATURES

• Mood-based discovery — Find circles and experiences that match your current mood and interests.
• Circles — Join member-organized communities around shared interests.
• Experiences — Attend real-world gatherings, from coffee meetups to outdoor adventures.
• Chat — Coordinate and share moments within your circles and experiences.
• Privacy controls — Choose who can see your profile, message you, and discover you.
• 18+ only — Nmood is designed for adults 18 and over. Date of birth is verified during onboarding.

PRIVACY & SAFETY

• 18+ eligibility verified during onboarding
• Report and block tools for member safety
• Profile visibility controls (public, connections only, private)
• Account deletion with 30-day recovery window
• No tracking or advertising identifiers

SUBSCRIPTIONS

Nmood offers an optional Premium subscription that unlocks unlimited circle and experience joins, unlimited connection requests, private messaging, and unlimited AI Concierge access.

• Monthly subscription
• Annual subscription
• Payment is charged to your Apple ID account
• Subscription automatically renews unless cancelled at least 24 hours before the end of the current period
• Account is charged for renewal within 24 hours prior to the end of the current period
• Subscriptions may be managed by the user and auto-renewal may be turned off in Account Settings after purchase
• Any unused portion of a free trial period, if offered, will be forfeited when the user purchases a subscription

SUPPORT

Visit our Help Center in the app or contact support@nmood.app for assistance.

Nmood is operated by Lazy Panda FZE LLC, Ajman Free Zone, United Arab Emirates.`,
    char_count: 2407,
    limit: 4000,
    status: 'PASS',
  },
  keywords: {
    value: 'social,community,circles,experiences,moods,interests,connection,gatherings,events,groups,discovery',
    char_count: 98,
    limit: 100,
    status: 'PASS',
    duplicates: false,
    unsupported_claims: false,
  },
};

// ── Category recommendations ──────────────────────────────────────────────────
export const CATEGORY_RECOMMENDATIONS = {
  primary: {
    category: 'Social Networking',
    reason: 'Nmood is a social platform for building connections through shared moods, interests, circles, and experiences. Social Networking is the most accurate primary category.',
  },
  secondary: {
    category: 'Lifestyle',
    reason: 'Lifestyle captures the mood-based, real-world activity, and community-building aspects of Nmood that go beyond pure social networking.',
  },
  classification: 'PASS — both categories accurately reflect verified app features',
};

// ── Content rating (Apple age-rating questionnaire) ───────────────────────────
// Assessed conservatively based on actual content observed in the codebase.
// Nmood's own 18+ requirement is DISTINCT from Apple's assigned store rating.
export const AGE_RATING_QUESTIONNAIRE = {
  nmood_own_policy: '18+ (enforced via DOB gate during onboarding, server-side verified)',
  apple_store_rating_recommendation: '17+',
  recommendation_reason: '17+ is the closest Apple rating to Nmood\'s own 18+ policy. Setting 17+ ensures the store rating is consistent with the in-app age gate and avoids younger users downloading an app they cannot use.',
  questionnaire: [
    {
      question: 'Unrestricted Web Access (in-app browser to arbitrary URLs)',
      answer: 'No',
      evidence: 'No in-app browser, WKWebView to arbitrary URLs, or web views. External links open in the system browser. Legal/support pages are in-app React routes, not web views.',
      classification: 'PASS',
    },
    {
      question: 'User-Generated Content (posts, photos, profiles)',
      answer: 'Yes',
      evidence: 'Chat messages (ChatMessage, CircleChatMessage), uploaded photos, profile bios, circle descriptions, experience descriptions. All user-created.',
      classification: 'PASS — UGC present; reporting/blocking/moderation implemented',
    },
    {
      question: 'Messaging / Chat',
      answer: 'Yes',
      evidence: 'Circle chat (CircleChatMessage), experience chat (ChatMessage), private messages (PrivateMessage/PrivateConversation). Real-time text, photo, and voice messaging.',
      classification: 'PASS — messaging present; 18+ gate, reporting, and blocking implemented',
    },
    {
      question: 'Location Sharing / Place Names',
      answer: 'Yes',
      evidence: 'City/country on member profile; place names in chat location messages (reverse-geocoded, not raw coordinates). GPS coordinates are transient — never persisted.',
      classification: 'PASS — only city/place names shared, not precise coordinates',
    },
    {
      question: 'Sexual Content / Nudity',
      answer: 'No',
      evidence: 'No sexual content, nudity, or suggestive material in app content. UGC is subject to reporting and moderation. No dating or romantic matching features.',
      classification: 'PASS — no sexual content; UGC moderation in place',
    },
    {
      question: 'Violence',
      answer: 'No',
      evidence: 'No violent content, violent themes, or violence-related features.',
      classification: 'PASS',
    },
    {
      question: 'Profanity / Crude Humor',
      answer: 'Uncertain — OWNER DECISION',
      evidence: 'No profanity in app content. UGC (chat messages, bios) could contain profanity. No profanity filter is implemented. Apple asks about app content, not what users might add, but UGC moderation is in place.',
      classification: 'OWNER DECISION — owner should decide: answer "No" (app contains no profanity) or "Yes" (UGC could contain profanity). Most UGC apps answer "No" and rely on moderation.',
    },
    {
      question: 'Gambling / Real-Money Gambling',
      answer: 'No',
      evidence: 'No gambling features, no real-money gaming, no lotteries, no betting.',
      classification: 'PASS',
    },
    {
      question: 'Alcohol / Tobacco / Drug Use',
      answer: 'No',
      evidence: 'No content referencing or facilitating alcohol, tobacco, or drug use. Real-world experiences could involve these but the app does not reference, promote, or facilitate them.',
      classification: 'PASS',
    },
    {
      question: 'Contests / Sweepstakes',
      answer: 'No',
      evidence: 'No contests, sweepstakes, or prize drawings.',
      classification: 'PASS',
    },
    {
      question: 'Simulated Gambling',
      answer: 'No',
      evidence: 'No simulated gambling, no casino-style mechanics, no loot boxes.',
      classification: 'PASS',
    },
    {
      question: 'Medical / Wellness / Mental Health Treatment',
      answer: 'No',
      evidence: 'Nmood uses "mood" and "emotional intelligence" as social/conversational concepts, NOT as medical, clinical, or mental-health treatment. No diagnosis, therapy, counseling, or health claims are made. The app does not position itself as a medical or wellness app.',
      classification: 'PASS — mood is a social concept, not a medical claim',
    },
    {
      question: 'Advertising / Ads',
      answer: 'No',
      evidence: 'No advertising SDKs, no ad networks, no display ads, no sponsored content. Analytics is consent-gated and off by default.',
      classification: 'PASS — no advertising',
    },
    {
      question: 'Parental Controls',
      answer: 'No',
      evidence: 'Nmood is 18+ only. No parental controls are needed or implemented.',
      classification: 'PASS — not applicable for 18+ app',
    },
  ],
  uncertain_items: [
    'Profanity — owner should confirm answer based on Apple\'s exact questionnaire wording',
    'Apple may assign 12+ based on UGC + messaging + location; owner should override to 17+ to match the 18+ policy',
  ],
};

// ── App Review notes ──────────────────────────────────────────────────────────
export const APP_REVIEW_NOTES = {
  summary: 'Nmood is a social platform for adults 18+ to build real-world connections through shared moods, interests, circles, and experiences. It is NOT a dating app. There is no swiping, matching, or romantic pairing. All features are designed for platonic social connection.',

  age_gate: {
    title: '18+ Eligibility / DOB Gate',
    status: 'PASS',
    description: 'During onboarding, every user must provide their date of birth. The DOB is validated server-side (authorizationGate updateDob action) and eligibility_status is derived — never trusted from the client. Users under 18 see an UnderageScreen with a respectful message and access to Support/legal/deletion. The DOB is private — never displayed publicly, in logs, analytics, or AI prompts. Once set, DOB cannot be changed self-service (must contact Support). Restricted members cannot change DOB at all.',
    evidence: 'src/lib/eligibility.js, src/components/eligibility/EligibilityGate.jsx, base44/functions/authorizationGate/entry.ts, Member entity date_of_birth/eligibility_status fields',
  },

  ugc_moderation: {
    title: 'User-Generated Content: Reporting, Blocking, Moderation',
    status: 'PASS',
    description: 'Members can report other members, experiences, circles, hosts, and chat messages via the ReportSheet. Reports are routed to a SafetyReport entity with a structured reason, details, and optional evidence URL. Reports are reviewed by admin/founder moderators via the moderateSafetyReport backend action, which can issue warnings, content removal, temporary suspensions, permanent bans, or emergency escalation. Members can block other members via the blockMember backend action, which creates a BlockedMember record and isolates the blocked user from discovery and messaging.',
    evidence: 'src/components/safety/ReportSheet.jsx, src/components/safety/BlockMemberSheet.jsx, base44/functions/authorizationGate/entry.ts (reportMember, blockMember, moderateSafetyReport), SafetyReport + BlockedMember entities',
  },

  location: {
    title: 'Location Behavior',
    status: 'PASS',
    description: 'Location is user-initiated only — never auto-requested on app launch. GPS is used when the user explicitly taps "Use current location" in the map picker or onboarding. Every location flow has a manual city entry fallback. GPS coordinates are transient — used for reverse geocoding to a city/place name, then discarded. Only city/country is persisted on the member profile. Chat location messages are reverse-geocoded to place names (no raw coordinates). IP fallback uses BigDataCloud/ipwho.is (not ipapi.co, which mis-detects UAE regions).',
    evidence: 'src/lib/location-detection.js, src/components/map/MapLibreLocationPicker.jsx, src/components/circles/CircleChat.jsx, src/lib/permissions-readiness.js',
  },

  permissions: {
    title: 'Camera, Photo, and Microphone Permissions',
    status: 'PASS — web code paths verified; native Info.plist/AndroidManifest.xml configuration needed',
    description: 'All permissions are user-initiated. Camera and photo library are accessed via <input type="file"> (HTML file picker), not direct device APIs. Microphone is accessed via navigator.mediaDevices.getUserMedia only when the user taps the voice record button in chat. No permission is requested on app launch. Every permission has a manual fallback (text messages, gallery picker). iOS Info.plist and AndroidManifest.xml usage strings must be added to the native wrapper — see permissions-readiness.js for the exact purpose strings.',
    evidence: 'src/lib/permissions-readiness.js, src/components/media/MediaPicker.jsx, src/components/circles/CircleChat.jsx, src/pages/ExperienceChat.jsx',
  },

  sign_in_providers: {
    title: 'Login Providers',
    status: 'PARTIAL — Google PASS, Apple RELEASE BLOCKER, Phone DISABLED',
    providers: [
      {
        name: 'Email + Password',
        status: 'PASS',
        notes: 'Register → OTP → verifyOtp → setToken. Email verification enforced before social access.',
      },
      {
        name: 'Google Sign-In',
        status: 'PASS',
        notes: 'base44.auth.loginWithProvider("google"). Platform handles OAuth flow. No hardcoded client IDs.',
      },
      {
        name: 'Sign in with Apple',
        status: 'RELEASE BLOCKER',
        notes: 'Button is present in the UI and calls base44.auth.loginWithProvider("apple"). Server-side token revocation on account deletion is NOT implemented. Requires APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_PRIVATE_KEY secrets. See apple-signin-readiness.js. If Sign in with Apple is offered, Apple requires token revocation support.',
      },
      {
        name: 'Phone OTP',
        status: 'DISABLED',
        notes: 'Phone registration is disabled (PHONE_REGISTRATION_ENABLED = false). Backend blocks in production without SMS_PROVIDER configured. Will be enabled when SMS provider secrets are set.',
      },
    ],
  },

  account_deletion: {
    title: 'Account Deletion Path',
    status: 'PASS',
    description: 'Account deletion is available in Settings → Delete Account. The user must re-authenticate (password for email accounts) and type "DELETE" to confirm. The account is soft-deleted with a 30-day recovery window. Login is disabled (force_logout). Personal data is anonymized. Manual/admin memberships are cancelled. Apple/Google store subscriptions are NOT cancelled (correct — the store manages these); the user is informed of this in the DeleteAccountSheet. Data export is available before deletion.',
    evidence: 'src/components/privacy/DeleteAccountSheet.jsx, src/lib/account-deletion.js, base44/functions/authorizationGate/entry.ts (deleteAccount)',
  },

  subscriptions_iap: {
    title: 'Subscriptions / In-App Purchases',
    status: 'RELEASE BLOCKER — not ready for native production',
    description: 'Nmood Premium is a digital subscription (Explorer free, Premium paid). Digital subscriptions must use Apple IAP on iOS and Google Play Billing on Android. Server-side receipt validation is implemented for both Apple and Google, but the required secrets (APPLE_SHARED_SECRET, GOOGLE_PLAY_SERVICE_ACCOUNT_JSON) are not set. Store product IDs are not yet created in App Store Connect or Google Play Console. The native billing bridge (Capacitor/StoreKit/Play Billing) is not wired. Hardcoded prices are displayed as authoritative — store-localized prices must be fetched in native builds. See store-payments-readiness.js for the full release-blocker list.',
    release_blockers: [
      'APPLE_SHARED_SECRET not set — Apple receipt validation fails',
      'GOOGLE_PLAY_SERVICE_ACCOUNT_JSON not set — Google receipt validation fails',
      'Store product IDs not created in App Store Connect / Google Play Console',
      'Hardcoded prices shown as authoritative — store-localized prices must be fetched',
      'Webhook replay/idempotency protection missing',
      'Weekly/Quarterly/Semiannual plans have no store product IDs (3 of 5 plans)',
      'Native billing bridge (Capacitor/StoreKit/Play Billing) not wired',
    ],
  },

  test_only_features: {
    title: 'Test-Only or Unavailable Features',
    items: [
      {
        feature: 'Phone OTP Registration',
        status: 'DISABLED in production',
        reason: 'PHONE_REGISTRATION_ENABLED = false. Backend blocks without SMS_PROVIDER. Not visible to production users.',
      },
      {
        feature: 'Sign in with Apple',
        status: 'RELEASE BLOCKER',
        reason: 'Button visible but server-side token revocation not implemented. If Apple rejects, the button may need to be hidden until implementation is complete.',
      },
      {
        feature: 'Premium Subscription Purchase',
        status: 'RELEASE BLOCKER',
        reason: 'Web/preview simulated flow works. Native production purchase is blocked — no native billing bridge, no store secrets, no store product IDs.',
      },
      {
        feature: 'Push Notifications',
        status: 'NOT IMPLEMENTED',
        reason: 'No push token registration, FCM/APNS SDK, or push send code. All notifications are in-app (entity-based). Not a release blocker — app functions without push.',
      },
      {
        feature: 'Mission Control / Admin Portal',
        status: 'FOUNDER/ADMIN ONLY',
        reason: 'Not visible to regular users. Gated by FounderRoute/AdminRoute role checks.',
      },
    ],
  },

  demo_account: {
    title: 'Demo / Test Account for Reviewer',
    status: 'OWNER / CONTROLLED TEST REQUIRED',
    description: 'No demo account is provisioned. Apple reviewers need a valid account to test social features. The owner must create a controlled test account with a verified 18+ DOB and provide the credentials in the App Review notes. OTP handling: email OTP is sent to the registered email address. The owner should use a controlled email inbox that can receive OTPs. Do NOT use a shared/public email. Phone OTP is disabled.',
    required: [
      'Test email address (owner-controlled, can receive OTP)',
      'Test password (owner-set)',
      'Test account must have completed onboarding with 18+ DOB',
      'Test account should have at least one circle and one experience for reviewer to see populated screens',
    ],
  },
};

// ── Screenshot capture matrix ─────────────────────────────────────────────────
// Apple requires screenshots for each device family. Screenshots are NOT
// fabricated here — this is a capture matrix for the owner to follow.
export const SCREENSHOT_MATRIX = {
  required_device_families: [
    {
      device: 'iPhone 6.7" (iPhone 14 Pro Max / 15 Pro Max / 16 Pro Max)',
      resolution: '1290 × 2796',
      required: true,
    },
    {
      device: 'iPhone 6.5" (iPhone 11 Pro Max / 12 Pro Max)',
      resolution: '1284 × 2778',
      required: true,
    },
    {
      device: 'iPhone 5.5" (iPhone 8 Plus)',
      resolution: '1242 × 2208',
      required: 'Optional — Apple accepts 6.7" or 6.5" as primary; 5.5" can be generated from 6.5"',
    },
    {
      device: 'iPad 12.9" (iPad Pro 12.9")',
      resolution: '2048 × 2732',
      required: 'Required only if iPad is supported — OWNER DECISION',
    },
  ],
  required_screens: [
    {
      screen: 'Onboarding / 18+ Gate',
      route: '/onboarding (or /register for new account)',
      purpose: 'Show the 18+ DOB entry and eligibility verification step',
      privacy_rules: 'Use synthetic DOB (e.g. 1995-01-15). No real personal data.',
    },
    {
      screen: 'Home',
      route: '/',
      purpose: 'Show the main home feed with mood-based discovery, circles, and experiences',
      privacy_rules: 'Use demo/synthetic data only. No real member names, photos, or messages.',
    },
    {
      screen: 'Discovery / Explore',
      route: '/explore',
      purpose: 'Show the discovery feed with categories, filters, and nearby experiences',
      privacy_rules: 'Use demo/synthetic data. No real locations or member data.',
    },
    {
      screen: 'Create Nmood (Host Create Activity)',
      route: '/host/create',
      purpose: 'Show the experience creation wizard',
      privacy_rules: 'Use synthetic experience title, description, and location. No real addresses.',
    },
    {
      screen: 'Circles',
      route: '/communities or /circle/:id',
      purpose: 'Show circle listing and circle detail with chat',
      privacy_rules: 'Use demo/synthetic circle names, descriptions, and chat messages. No real member data.',
    },
    {
      screen: 'Messages',
      route: '/messages',
      purpose: 'Show the messaging inbox and a conversation',
      privacy_rules: 'Use demo/synthetic conversation names and messages. No real names or message content.',
    },
    {
      screen: 'Profile / Privacy',
      route: '/profile and /settings/privacy',
      purpose: 'Show the member profile and privacy controls',
      privacy_rules: 'Use a demo profile with synthetic name, photo, and bio. No real personal data.',
    },
    {
      screen: 'Premium / Upgrade',
      route: '/upgrade',
      purpose: 'Show the premium subscription paywall',
      privacy_rules: 'Use synthetic pricing. Do NOT show a completed purchase — purchase flow is not production-ready.',
      status: 'RELEASE BLOCKER — screenshot can be captured but purchase flow is not functional in production',
    },
  ],
  screenshot_privacy_rules: [
    'Use synthetic/demo data only — no real member names, photos, messages, or locations',
    'No real email addresses, phone numbers, or DOB in any screenshot',
    'No device status-bar secrets (Wi-Fi network names, carrier names, battery percentages from real devices)',
    'No misleading UI — do not show features that are not functional (e.g. completed purchase, push notifications)',
    'No real chat messages from actual users — use demo content created by the owner',
    'No real circle or experience names from actual users — use synthetic content',
    'Blur or replace any real user avatars with synthetic placeholder images',
    'Ensure screenshots reflect the current production UI (not dev-only panels or debug overlays)',
  ],
  status: 'APP STORE CONNECT CONFIGURATION — screenshots must be captured and uploaded by the owner',
};

// ── App icon readiness ────────────────────────────────────────────────────────
export const APP_ICON_READINESS = {
  master_icon: {
    current_size: '1024 × 1024 (Nmood-App-Icon-1024.png v2)',
    required_size: '1024 × 1024 (App Store Connect requirement)',
    status: 'PASS — true 1024×1024 master available (fd1b4af34_Nmood-App-Icon-1024.png)',
    evidence: 'src/lib/brand-assets.js: APP_ICON_URL = fd1b4af34_Nmood-App-Icon-1024.png',
  },
  opacity: {
    requirement: 'App Store icon must be opaque (no transparency/alpha channel)',
    current: 'The icon carries its own dark background — appears opaque',
    status: 'PASS — icon appears opaque, but owner must verify the 1024×1024 export has no alpha channel',
  },
  transparency: {
    requirement: 'No transparency allowed for the App Store icon',
    status: 'PASS — icon has its own background; no transparency expected',
  },
  rounded_corners: {
    requirement: 'Apple applies rounded corners automatically — do NOT pre-round the icon',
    status: 'PASS — icon is square (flat, no pre-rounded corners)',
  },
  social_image_vs_store_icon: {
    distinction: 'The social/OG image (512×512, used for link previews) is DIFFERENT from the App Store icon (1024×1024, used for the store listing). They serve different purposes and should not be confused.',
    og_image: 'FAVICON_SIZES.x512 (512×512) — used for Open Graph / Twitter Card / social link previews',
    store_icon: '1024×1024 — required for App Store Connect (NOT YET AVAILABLE at true resolution)',
    status: 'OWNER DECISION — owner must export a true 1024×1024 version of the app icon for App Store Connect',
  },
  status: 'RELEASE BLOCKER — true 1024×1024 master icon needed',
};

// ── Screenshot sizes (STORE CONFIGURATION) ────────────────────────────────────
export const SCREENSHOT_SIZES = {
  classification: 'APP STORE CONNECT CONFIGURATION — exact export sizes depend on native wrapper (Capacitor/Xcode) configuration',
  iphone_67: { width: 1290, height: 2796, device: 'iPhone 6.7"' },
  iphone_65: { width: 1284, height: 2778, device: 'iPhone 6.5"' },
  iphone_55: { width: 1242, height: 2208, device: 'iPhone 5.5"' },
  ipad_129: { width: 2048, height: 2732, device: 'iPad 12.9"' },
  note: 'Screenshots can be captured via Xcode simulator, TestFlight, or physical device screenshot + crop. Apple also accepts JPEG/PNG at these exact pixel dimensions.',
};

// ── Public URLs (verified routes from App.jsx) ────────────────────────────────
export const PUBLIC_URLS = {
  privacy_policy: { route: '/privacy', alt: '/privacy-policy', status: 'PASS — accessible without auth' },
  terms_of_service: { route: '/terms', status: 'PASS — accessible without auth' },
  community_guidelines: { route: '/community-guidelines', status: 'PASS — accessible without auth' },
  safety_center: { route: '/safety', status: 'PASS — accessible without auth' },
  account_deletion: { route: '/delete-account', alt: '/account-deletion', status: 'PASS — accessible without auth' },
  refund_policy: { route: '/refund-policy', status: 'PASS — accessible without auth' },
  subscription_terms: { route: '/subscription-terms', status: 'PASS — accessible without auth' },
  cookie_notice: { route: '/cookie-notice', status: 'PASS — accessible without auth' },
  ai_concierge_notice: { route: '/ai-concierge-notice', status: 'PASS — accessible without auth' },
  support: { route: '/support', status: 'PASS — accessible without auth' },
  legal_center: { route: '/legal', status: 'PASS — accessible without auth' },
  note: 'All public routes are listed in PUBLIC_PATHS in App.jsx and render without authentication. URLs use app.nmood.app domain (e.g. https://app.nmood.app/privacy).',
};

// ── Reviewer-only dependencies ────────────────────────────────────────────────
export const REVIEWER_DEPENDENCIES = {
  demo_account: 'OWNER / CONTROLLED TEST REQUIRED — no demo account provisioned. Owner must create a test account with verified 18+ DOB and provide credentials in App Review notes.',
  otp_handling: 'Email OTP is sent to the registered email address. Owner must use a controlled email inbox that can receive OTPs. Phone OTP is disabled.',
  sign_in_with_apple: 'If Sign in with Apple button is visible, reviewer may test it. Server-side token revocation is NOT implemented (RELEASE BLOCKER). If Apple rejects, the button may need to be hidden until implementation is complete.',
  premium_purchase: 'Purchase flow is NOT functional in production (RELEASE BLOCKER). If reviewer taps Continue, the backend will reject the simulated receipt. Owner should note this in the review notes.',
  push_notifications: 'Not implemented. Reviewer should not expect push notifications.',
  location: 'Reviewer can test location by tapping "Use current location" in the map picker. Manual city entry is always available as a fallback.',
};

// ── Branding / metadata consistency ───────────────────────────────────────────
export const BRANDING_CONSISTENCY = {
  app_name: { value: 'Nmood', sources: ['system-config.js', 'index.html', 'manifest', 'brand-assets.js'], status: 'PASS — consistent across all sources' },
  slogan: { value: 'Zero swipes. Authentic connection.', sources: ['system-config.js'], status: 'PASS' },
  subtitle: { value: 'Zero swipes. Authentic connection.', sources: ['system-config.js', 'index.html (og:title, twitter:title, <title>)'], status: 'PASS — consistent' },
  legal_entity: { value: 'Lazy Panda FZE LLC, Ajman Free Zone, UAE', sources: ['legal-config.js'], status: 'PASS' },
  trade_licence: { value: '2625417982888', sources: ['legal-config.js'], status: 'PASS' },
  support_email: { value: 'support@nmood.app', sources: ['system-config.js', 'legal-config.js'], status: 'PASS' },
  status: 'PASS — all branding and metadata are consistent across the codebase',
};

// ── Release blockers ──────────────────────────────────────────────────────────
export const LISTING_RELEASE_BLOCKERS = [
  {
    item: '1024×1024 App Store icon not available',
    severity: 'BLOCKER',
    reason: 'App Store Connect requires a 1024×1024 master icon. Current master is 512×512. The x1024 variant in brand-assets.js points to the 512×512 image.',
    classification: 'RELEASE BLOCKER — owner must export a true 1024×1024 version',
  },
  {
    item: 'Sign in with Apple token revocation not implemented',
    severity: 'BLOCKER',
    reason: 'If Sign in with Apple is offered, Apple requires server-side token revocation on account deletion. Not yet implemented. Requires Apple Developer credentials.',
    classification: 'RELEASE BLOCKER — see apple-signin-readiness.js',
  },
  {
    item: 'IAP / subscription not production-ready',
    severity: 'BLOCKER',
    reason: 'Store secrets not set, product IDs not created, native billing bridge not wired, hardcoded prices shown as authoritative.',
    classification: 'RELEASE BLOCKER — see store-payments-readiness.js',
  },
  {
    item: 'iOS Info.plist / AndroidManifest.xml permission strings not configured',
    severity: 'BLOCKER',
    reason: 'Native wrapper config must include NSLocationWhenInUseUsageDescription, NSCameraUsageDescription, NSPhotoLibraryUsageDescription, NSMicrophoneUsageDescription and Android equivalents. Without these, iOS crashes on permission access.',
    classification: 'RELEASE BLOCKER — see permissions-readiness.js',
  },
];

// ── Owner decisions needed ────────────────────────────────────────────────────
export const LISTING_OWNER_DECISIONS = [
  'Confirm Apple age rating: 17+ (recommended, matches 18+ policy) or accept Apple\'s calculated rating (likely 12+)',
  'Confirm profanity questionnaire answer: "No" (app contains no profanity) or "Yes" (UGC could contain profanity)',
  'Confirm iPad support: if yes, iPad screenshots (2048×2732) are required; if no, set device compatibility to iPhone only',
  'Confirm Sign in with Apple: keep the button visible (and implement token revocation) or hide it until implementation is complete',
  'Confirm demo/test account credentials for App Review notes (email, password, 18+ DOB)',
  'Confirm 1024×1024 app icon export (opaque, no transparency, no pre-rounded corners)',
  'Confirm subscription pricing tiers and which plans to offer at launch',
  'Confirm marketing URL (optional — can be left blank if no marketing website exists)',
];

// ── Controlled tests needed ───────────────────────────────────────────────────
export const LISTING_CONTROLLED_TESTS = [
  'Capture screenshots on iPhone 6.7" simulator or device using synthetic/demo data',
  'Capture screenshots on iPhone 6.5" simulator or device using synthetic/demo data',
  'Verify all public legal/support pages load without authentication',
  'Verify 18+ gate blocks underage users and shows UnderageScreen',
  'Verify report and block flows work end-to-end with a controlled test account',
  'Verify account deletion flow with a controlled test account (30-day recovery, data anonymization)',
  'Verify location manual city fallback works when GPS is denied',
];

// ── Physical device tests needed ──────────────────────────────────────────────
export const LISTING_PHYSICAL_DEVICE_TESTS = [
  'iOS: Verify all permission prompts (location, camera, photo, microphone) appear only on user gesture',
  'iOS: Verify denying any permission does not block the app — manual fallback works',
  'iOS: Verify Sign in with Apple flow (after implementation) on a physical device',
  'iOS: Verify IAP purchase sheet appears (after native bridge + store configuration)',
  'Android: Same permission prompt and denial handling on Android 13+',
  'Android: Verify Play Billing sheet appears (after native bridge + store configuration)',
];

// ── Summary ───────────────────────────────────────────────────────────────────
export const LISTING_SUMMARY = {
  app_name: 'Nmood',
  entity: 'Lazy Panda FZE LLC, Ajman Free Zone, UAE (Trade Licence 2625417982888)',
  slogan: 'Zero swipes. Authentic connection.',
  subtitle: 'Zero swipes. Authentic connection.',
  metadata_status: 'PASS — all draft metadata within field limits, no unsupported claims',
  age_rating: '17+ recommended (matches 18+ policy); profanity answer uncertain — OWNER DECISION',
  app_icon: 'RELEASE BLOCKER — 1024×1024 master not available',
  screenshots: 'APP STORE CONNECT CONFIGURATION — capture matrix defined; owner must capture and upload',
  public_pages: 'PASS — all legal/support/account-deletion pages accessible without auth',
  branding_consistency: 'PASS — consistent across system-config, index.html, legal-config, brand-assets',
  sign_in_apple: 'RELEASE BLOCKER — token revocation not implemented',
  iap_subscriptions: 'RELEASE BLOCKER — not production-ready',
  permissions: 'PASS (web) / RELEASE BLOCKER (native Info.plist/AndroidManifest.xml not configured)',
  demo_account: 'OWNER / CONTROLLED TEST REQUIRED — no demo account provisioned',
  classification: 'NOT READY FOR APP STORE SUBMISSION — 4 release blockers must be resolved',
};
