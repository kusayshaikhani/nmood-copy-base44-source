import { base44 } from '@/api/base44Client';
import { getAnalyticsConsent } from './consent-store';

// Anonymous product analytics. Privacy by design:
// - Only event name + category + non-identifying properties are stored.
// - No message content, profile data, or PII is ever attached.
// - Aggregation is service-role + admin-gated in the productAnalytics function.
// trackProductEvent is fire-and-forget; it must never block or break a flow.

// Security/account-operation events — NOT product analytics. These are never
// sent to product analytics, advertising, or marketing systems. Browser console
// output is not a durable audit log; proper access-controlled backend audit
// logging remains a future implementation item.
const SECURITY_OPERATION_EVENTS = new Set([
  'Login',
  'Logout',
  'Account Deleted',
  'Registration Started',
  'Registration Completed',
]);

export const PRODUCT_EVENTS = {
  // account
  REGISTRATION_STARTED: 'Registration Started',
  REGISTRATION_COMPLETED: 'Registration Completed',
  LOGIN: 'Login',
  LOGOUT: 'Logout',
  ACCOUNT_DELETED: 'Account Deleted',
  // profile
  PROFILE_COMPLETED: 'Profile Completed %',
  PROFILE_REACHED_100: 'Profile Reached 100%',
  PHOTO_UPLOADED: 'Photo Uploaded',
  VERIFICATION_STARTED: 'Verification Started',
  VERIFICATION_COMPLETED: 'Verification Completed',
  // discovery
  MOOD_SELECTED: 'Mood Selected',
  AI_PICK_VIEWED: 'AI Pick Viewed',
  MAGIC_DOOR_USED: 'Magic Door Used',
  SEARCH_PERFORMED: 'Search Performed',
  SEARCH_RESULT_SELECTED: 'Search Result Selected',
  // connections
  CONNECTION_REQUEST_SENT: 'Connection Request Sent',
  CONNECTION_ACCEPTED: 'Connection Accepted',
  CONNECTION_DECLINED: 'Connection Declined',
  NEW_PAL_CREATED: 'New Pal Created',
  // experiences
  EXPERIENCE_CREATED: 'Experience Created',
  EXPERIENCE_JOINED: 'Experience Joined',
  EXPERIENCE_LEFT: 'Experience Left',
  EXPERIENCE_COMPLETED: 'Experience Completed',
  // circles
  CIRCLE_CREATED: 'Circle Created',
  CIRCLE_JOINED: 'Circle Joined',
  CIRCLE_LEFT: 'Circle Left',
  // membership journey (MP-006)
  MEMBERSHIP_SCREEN_VIEWED: 'Membership Screen Viewed',
  FIRST_PREMIUM_PROMPT: 'First Premium Prompt',
  UPGRADE_CLICKED: 'Upgrade Clicked',
  SUBSCRIPTION_STARTED: 'Subscription Started',
  SUBSCRIPTION_RENEWED: 'Subscription Renewed',
  SUBSCRIPTION_CANCELLED: 'Subscription Cancelled',
  SUBSCRIPTION_EXPIRED: 'Subscription Expired',
  SUBSCRIPTION_GRACE_ENTERED: 'Subscription Grace Entered',
  SUBSCRIPTION_RECOVERED: 'Subscription Recovered',
  SUBSCRIPTION_RESTORED: 'Subscription Restored',
  PREMIUM_FEATURE_USED: 'Premium Feature Used',
};

const CATEGORY_MAP = {};
const groupCategories = [
  ['account', ['Registration Started', 'Registration Completed', 'Login', 'Logout', 'Account Deleted']],
  ['profile', ['Profile Completed %', 'Profile Reached 100%', 'Photo Uploaded', 'Verification Started', 'Verification Completed']],
  ['discovery', ['Mood Selected', 'AI Pick Viewed', 'Magic Door Used', 'Search Performed', 'Search Result Selected']],
  ['connections', ['Connection Request Sent', 'Connection Accepted', 'Connection Declined', 'New Pal Created']],
  ['experiences', ['Experience Created', 'Experience Joined', 'Experience Left', 'Experience Completed']],
  ['circles', ['Circle Created', 'Circle Joined', 'Circle Left']],
  ['membership', [
    'Membership Screen Viewed', 'First Premium Prompt', 'Upgrade Clicked',
    'Subscription Started', 'Subscription Renewed', 'Subscription Cancelled',
    'Subscription Expired', 'Subscription Grace Entered', 'Subscription Recovered',
    'Subscription Restored', 'Premium Feature Used',
  ]],
];
for (const [cat, names] of groupCategories) for (const n of names) CATEGORY_MAP[n] = cat;

const ALLOWED_PROPERTIES = new Set([
  'method', 'mood', 'category', 'query', 'resultType',
  'percent', 'experienceId', 'circleId', 'tier', 'plan', 'provider', 'feature', 'item',
  'usageCount', 'journeyStage', 'source', 'daysSinceJoin', 'platform', 'device',
]);

function sanitize(properties) {
  if (!properties || typeof properties !== 'object') return {};
  const out = {};
  for (const k of Object.keys(properties)) {
    if (ALLOWED_PROPERTIES.has(k)) out[k] = properties[k];
  }
  return out;
}

export function trackProductEvent(eventName, properties = {}) {
  // Security/account-operation events: record as audit logs only, never as
  // product analytics. No behavioural data is sent to product analytics systems.
  if (SECURITY_OPERATION_EVENTS.has(eventName)) {
    try { console.info(`[audit] ${eventName}`); } catch { /* never break */ }
    return;
  }
  // Optional product analytics — gated behind explicit consent. Off by default.
  if (!getAnalyticsConsent()) return;
  const safe = sanitize(properties);
  try { base44.analytics.track({ eventName, properties: safe }); } catch { /* never break */ }
  try {
    const category = CATEGORY_MAP[eventName] || 'account';
    base44.entities.ProductEvent.create({ event_name: eventName, category, properties: safe }).catch(() => {});
  } catch { /* never break */ }
}