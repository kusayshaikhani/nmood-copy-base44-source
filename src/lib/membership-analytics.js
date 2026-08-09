import { base44 } from '@/api/base44Client';
import { trackProductEvent, PRODUCT_EVENTS } from '@/lib/product-analytics';
import { getAnalyticsConsent } from '@/lib/consent-store';

// MP-006: Membership Intelligence — privacy-first journey + feature-usage tracking.
// - Fire-and-forget: never blocks or breaks a flow.
// - Only non-identifying properties are attached (sanitized upstream in product-analytics).
// - Premium feature usage is kept locally (localStorage) for the member's own insight
//   and emitted as an anonymous aggregate ProductEvent for backend roll-ups.

export const MEMBERSHIP_EVENTS = {
  VIEWED: 'Membership Viewed',
  FIRST_PREMIUM_PROMPT: 'First Premium Prompt',
  UPGRADE_CLICKED: 'Upgrade Clicked',
  LIMIT_REACHED: 'Explorer Limit Reached',
  PURCHASED: 'Membership Purchased',
  RESTORED: 'Membership Restored',
  RENEWED: 'Membership Renewed',
  CANCELLED: 'Membership Cancelled',
  RECOVERED: 'Membership Recovered',
  GRACE_ENTERED: 'Membership Grace Entered',
  EXPIRED: 'Membership Expired',
  PREMIUM_FEATURE_USED: 'Premium Feature Used',
};

// Premium feature identifiers — must stay in sync with the permission engine.
export const PREMIUM_FEATURES = {
  PRIVATE_MESSAGING: 'private_messaging',
  ADVANCED_DISCOVERY: 'advanced_discovery',
  UNLIMITED_EXPERIENCES: 'unlimited_experiences',
  UNLIMITED_CIRCLES: 'unlimited_circles',
  PROFILE_VISITORS: 'profile_visitors',
  ADVANCED_SEARCH: 'advanced_search',
  AI_RECOMMENDATIONS: 'ai_recommendations',
};

const STORE_KEY = 'nmood:premium-feature-usage';

function readStore() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || '{}') || {};
  } catch {
    return {};
  }
}

function writeStore(store) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch {
    // storage may be unavailable; never throw
  }
}

export function trackMembershipEvent(event, properties = {}) {
  // Optional product analytics — gated behind explicit consent. Off by default.
  // Security/account-operation events are handled separately in product-analytics.
  if (!getAnalyticsConsent()) return;
  try {
    base44.analytics.track({ eventName: event, properties });
  } catch {
    // analytics should never break the flow
  }
}

// Record a premium feature usage event.
// Stores usage count + first/last usage locally and emits an anonymous aggregate event
// (feature name + cumulative count only). No content or personal data attached.
export function trackPremiumFeature(feature, context = {}) {
  if (!feature) return;
  try {
    const store = readStore();
    const entry = store[feature] || { count: 0, first: null, last: null };
    entry.count += 1;
    if (!entry.first) entry.first = Date.now();
    entry.last = Date.now();
    store[feature] = entry;
    writeStore(store);
  } catch {
    // local store is best-effort
  }
  trackProductEvent(PRODUCT_EVENTS.PREMIUM_FEATURE_USED, {
    feature,
    usageCount: (readStore()[feature] || {}).count || 1,
    source: context.source || null,
  });
}

// Read the member's own local feature-usage summary (for optional self-insight surfaces).
export function getPremiumFeatureUsage() {
  return readStore();
}

// Most frequently used premium feature for this member (local only).
export function getTopPremiumFeature() {
  const store = readStore();
  let top = null;
  for (const f of Object.keys(store)) {
    if (!top || store[f].count > store[top].count) top = f;
  }
  return top;
}

// Fire a journey-stage event (e.g. first premium prompt, renewal, recovery).
export function trackJourneyStage(stage, properties = {}) {
  trackProductEvent(stage, { ...properties, journeyStage: stage });
}