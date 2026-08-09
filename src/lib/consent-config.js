// Centralized consent & cookie configuration — single source of truth for
// browser storage categories, descriptions, version, and third-party
// processors. Used by the Cookie Notice page and Settings > Privacy so
// categories and descriptions cannot drift.
//
// Based on a full code audit (August 2026). No third-party advertising cookies,
// no cross-site tracking pixels, no behavioral advertising networks, no
// service workers, no fingerprinting were found.

export const CONSENT_VERSION = 'CC-001-v1.0';

// ── Storage categories ───────────────────────────────────────────────
// Each category lists the actual browser storage items used by Nmood,
// classified per the audit.
export const STORAGE_CATEGORIES = [
  {
    id: 'strictly_necessary',
    name: 'Strictly Necessary',
    description: 'Required for the app to function and for security. Cannot be disabled.',
    canDisable: false,
    items: [
      { name: 'Authentication tokens', purpose: 'Keep you signed in between sessions', storage: 'localStorage', persistent: true },
      { name: 'Legal consent record', purpose: 'Record your acceptance of Terms and Privacy Policy versions', storage: 'localStorage', persistent: true },
      { name: 'Session state', purpose: 'Maintain your session during use', storage: 'sessionStorage', persistent: false },
      { name: 'Error & crash reports', purpose: 'Service stability and security (redacted, first-party)', storage: 'server-side (ErrorLog)', persistent: true },
    ],
  },
  {
    id: 'functional',
    name: 'Functional / Preference',
    description: 'Remember your choices and improve your experience. Can be cleared without losing access to your account.',
    canDisable: true,
    items: [
      { name: 'Theme preference', purpose: 'Remember light/dark mode', storage: 'localStorage', persistent: true },
      { name: 'Language preference', purpose: 'Remember selected language', storage: 'localStorage', persistent: true },
      { name: 'Onboarding progress', purpose: 'Resume onboarding where you left off', storage: 'localStorage', persistent: true },
      { name: 'Sidebar state', purpose: 'Remember sidebar open/closed position (UI only)', storage: 'cookie', persistent: true },
      { name: 'Search filters', purpose: 'Remember your last search filter selection', storage: 'sessionStorage', persistent: false },
      { name: 'Premium feature usage', purpose: 'Your own feature usage insights (local only, not transmitted)', storage: 'localStorage', persistent: true },
      { name: 'Image cache', purpose: 'Temporary cache of profile photos to reduce network requests', storage: 'localStorage', persistent: true },
    ],
  },
  {
    id: 'analytics',
    name: 'Analytics (Optional)',
    description: 'Anonymous product usage data. Off by default. Only collected with your explicit consent. Can be toggled in Settings → Privacy.',
    canDisable: true,
    consentRequired: true,
    items: [
      { name: 'Product events', purpose: 'Event name, category, and non-identifying properties (e.g. "Experience Joined", "Circle Created"). No message content, profile data, or PII.', storage: 'server-side (ProductEvent entity)', persistent: true },
    ],
  },
];

// ── Trackers NOT found in the codebase ──────────────────────────────
// Affirmative list of what the audit confirmed is absent.
export const TRACKERS_NOT_FOUND = [
  'Third-party advertising cookies or ad networks',
  'Cross-site tracking pixels or social media tracking',
  'Behavioral advertising or ad targeting',
  'Advertising identifiers for ad personalization',
  'Fingerprinting for advertising purposes',
  'Google Analytics, Facebook Pixel, or similar third-party analytics',
  'Google Tag Manager or similar container tags',
  'Service workers or background sync',
  'Third-party cookies',
];

// ── Third-party processors ───────────────────────────────────────────
// Services that receive or process user data, based on actual code inspection.
export const THIRD_PARTY_PROCESSORS = [
  { name: 'Base44', purpose: 'Hosting, authentication, database, AI, email, file storage, analytics', dataShared: 'Account data, profile, messages, uploaded files', linkedToIdentity: true },
  { name: 'MapTiler', purpose: 'Map tiles for location displays', dataShared: 'Map viewport coordinates (transient)', linkedToIdentity: false },
  { name: 'BigDataCloud', purpose: 'Reverse geocoding for city detection', dataShared: 'GPS coordinates (transient, not stored)', linkedToIdentity: false },
  { name: 'ipwho.is', purpose: 'IP-based city fallback when GPS is denied', dataShared: 'IP address (transient, not stored)', linkedToIdentity: false },
  { name: 'Google Fonts', purpose: 'Typography (Plus Jakarta Sans)', dataShared: 'None (CSS resource only)', linkedToIdentity: false },
  { name: 'Unsplash', purpose: 'Stock photos for demo/seed content', dataShared: 'None (static image URLs)', linkedToIdentity: false },
  { name: 'Apple', purpose: 'In-App Purchase subscription billing', dataShared: 'Receipt data (validated server-side, not stored)', linkedToIdentity: true },
  { name: 'Google', purpose: 'Play Billing subscription billing and OAuth sign-in', dataShared: 'Purchase token (validated server-side, not stored); email, name (via OAuth)', linkedToIdentity: true },
  { name: 'Apple', purpose: 'OAuth sign-in provider', dataShared: 'Email, name (via OAuth)', linkedToIdentity: true },
];

// ── Device permissions (not cookies) ────────────────────────────────
// These are OS/browser-level permissions, not browser cookies. They are
// requested just-in-time when the related feature is invoked.
export const DEVICE_PERMISSIONS = [
  {
    id: 'location',
    name: 'Location',
    purpose: 'Detect your city for local discovery and map displays',
    whenRequested: 'During onboarding and when you open the map or nearby discovery',
    storedData: 'City and country only (on your profile). GPS coordinates are transient — used for reverse geocoding then discarded, never persisted.',
    manualFallback: 'Manual city selection is always available; approximate IP fallback is used if GPS is denied.',
  },
  {
    id: 'camera',
    name: 'Camera & Photos',
    purpose: 'Capture photos for profile, experiences, and chat',
    whenRequested: 'When you tap the photo button in chat, profile editor, or experience creation',
    storedData: 'Photos you choose to upload are stored as file URLs. No photos are captured without your explicit action.',
    manualFallback: 'You can always select existing photos from your library instead of capturing new ones.',
  },
  {
    id: 'notifications',
    name: 'Notifications',
    purpose: 'Receive experience reminders, pal requests, and chat notifications',
    whenRequested: 'After onboarding, when you enable notifications in Settings',
    storedData: 'Notification preference (on/off). Push token is managed by the native platform.',
    manualFallback: 'Notifications are optional. You can use the app fully without them.',
  },
];