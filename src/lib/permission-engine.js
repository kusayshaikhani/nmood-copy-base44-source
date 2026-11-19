// MP-001 Central Permission Engine — the ONLY place feature permission
// decisions are made. Every feature check flows through requestPermission().
// Reads membership state from the central membership-engine (cached by the
// MembershipProvider after auth); never queries the DB directly.

import { effectiveType, MEMBERSHIP_TYPES } from '@/lib/membership-engine';
import { isFounderAccessEnabled } from '@/lib/launch-mode';

// Centralized feature identifiers.
export const FEATURES = {
  ADVANCED_SEARCH: 'advanced_search',
  PROFILE_VIEWS: 'profile_views',
  CREATE_CIRCLE: 'create_circle',
  CREATE_EXPERIENCE: 'create_experience',
  HOST_EXPERIENCE: 'host_experience',
  MESSAGING_VOICE: 'messaging_voice',
  MESSAGING_PHOTOS: 'messaging_photos',
  MESSAGING_VIDEOS: 'messaging_videos',
  MESSAGING_CAMERA: 'messaging_camera',
  MESSAGING_LOCATION: 'messaging_location',
  MESSAGING_INMOOD_ACTIONS: 'messaging_inmood_actions',
  JOIN_CIRCLE: 'join_circle',
  JOIN_EXPERIENCE: 'join_experience',
  CONNECTION_REQUEST: 'connection_request',
  VIEW_INCOMING_REQUESTS: 'view_incoming_requests',
  VIEW_FULL_PROFILE: 'view_full_profile',
  PRIVATE_MESSAGING: 'private_messaging',
  CIRCLE_CHAT: 'circle_chat',
  PRIORITY_PROFILE_VISIBILITY: 'priority_profile_visibility',
  CONCIERGE: 'concierge',
};

// Premium-only features (Explorer: not available / hidden).
const PREMIUM_ONLY = new Set([
  FEATURES.ADVANCED_SEARCH,
  FEATURES.PROFILE_VIEWS,
  FEATURES.CREATE_CIRCLE,
  FEATURES.CREATE_EXPERIENCE,
  FEATURES.HOST_EXPERIENCE,
  FEATURES.MESSAGING_VOICE,
  FEATURES.MESSAGING_PHOTOS,
  FEATURES.MESSAGING_VIDEOS,
  FEATURES.MESSAGING_CAMERA,
  FEATURES.MESSAGING_LOCATION,
  FEATURES.MESSAGING_INMOOD_ACTIONS,
  FEATURES.PRIVATE_MESSAGING,
  FEATURES.CIRCLE_CHAT,
  FEATURES.PRIORITY_PROFILE_VISIBILITY,
]);

// Explorer can Like up to 25 people in a rolling 24-hour window. Premium is unlimited.
const LIMITED = {
  [FEATURES.CONNECTION_REQUEST]: { action: 'connection_request', key: 'likes', windowHours: 24, max: 25 },

};



/**
 * Request permission for a feature. Returns a decision object — never throws.
 * UI must never hardcode tier checks; always call this (or hasPermission).
 * Returns: { allowed, reason, feature, used?, limit?, remaining?, windowHours?, visibleCount? }
 */
export function requestPermission(feature, membership, context = {}) {
  const governed = [FEATURES.CONNECTION_REQUEST, FEATURES.VIEW_INCOMING_REQUESTS, FEATURES.VIEW_FULL_PROFILE].includes(feature);
  if (governed) {
    const policy = membership?.explorer_policy;
    if (!policy) return { allowed: false, reason: 'verification_pending', feature };
    if (policy.premium) return { allowed: true, reason: 'ok', feature, unlimited: true };
    if ([FEATURES.VIEW_INCOMING_REQUESTS, FEATURES.VIEW_FULL_PROFILE].includes(feature)) return { allowed: false, reason: 'premium_only', feature, visibleCount: 0 };
    return { allowed: policy.remaining > 0, reason: policy.remaining > 0 ? 'ok' : 'limit_reached', feature, used: policy.used, remaining: policy.remaining, limit: policy.limit ?? 25, windowHours: policy.window_hours ?? 24 };
  }
  if (isFounderAccessEnabled() && ![FEATURES.CONNECTION_REQUEST, FEATURES.JOIN_CIRCLE, FEATURES.JOIN_EXPERIENCE, FEATURES.VIEW_INCOMING_REQUESTS, FEATURES.VIEW_FULL_PROFILE].includes(feature)) return { allowed: true, reason: 'founder_access', feature, unlimited: true };
  const tier = effectiveType(membership);

  if (tier === MEMBERSHIP_TYPES.premium) {
    return { allowed: true, reason: 'ok', feature, unlimited: true };
  }

  // Explorer
  if (PREMIUM_ONLY.has(feature)) {
    return { allowed: false, reason: 'premium_only', feature };
  }

  if (feature === FEATURES.PRIVATE_MESSAGING) {
    const isPal = !!context.isPal;
    const eitherPremium = !!context.viewerPremium || !!context.otherPremium;
    const allowed = isPal && eitherPremium;
    return { allowed, reason: allowed ? 'ok' : (isPal ? 'premium_required' : 'pals_required'), feature };
  }

  return { allowed: true, reason: 'ok', feature };
}

/** Boolean convenience for simple checks. */
export function hasPermission(feature, membership, context = {}) {
  return requestPermission(feature, membership, context).allowed;
}

/** Remaining quota for a limited feature, or unlimited for premium. */
export function remainingLimit(feature, membership) {
  const limit = LIMITED[feature];
  if (limit) {
    const policy = membership?.explorer_policy;
    if (policy?.premium) return { unlimited: true, remaining: Infinity, used: 0, limit: null, windowHours: null };
    return { unlimited: false, remaining: policy?.remaining ?? 0, used: policy?.used ?? 25, limit: policy?.limit ?? limit.max, windowHours: policy?.window_hours ?? limit.windowHours };
  }
  const unlimited = isFounderAccessEnabled() || effectiveType(membership) === MEMBERSHIP_TYPES.premium;
  return { unlimited, remaining: unlimited ? Infinity : 0, used: 0, limit: unlimited ? null : 0, windowHours: null };
}
