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
  PRIORITY_PROFILE_VISIBILITY: 'priority_profile_visibility',
  CONCIERGE: 'concierge',
};

// Premium-only features (Explorer: not available / hidden).
const PREMIUM_ONLY = new Set([
  FEATURES.ADVANCED_SEARCH,
  FEATURES.PROFILE_VIEWS,
  FEATURES.CREATE_CIRCLE,
  FEATURES.CREATE_EXPERIENCE,
  FEATURES.MESSAGING_VOICE,
  FEATURES.MESSAGING_PHOTOS,
  FEATURES.MESSAGING_VIDEOS,
  FEATURES.MESSAGING_CAMERA,
  FEATURES.MESSAGING_LOCATION,
  FEATURES.MESSAGING_INMOOD_ACTIONS,
  FEATURES.PRIVATE_MESSAGING,
  FEATURES.PRIORITY_PROFILE_VISIBILITY,
]);

// Explorer-limited features: sliding window quotas. Premium = unlimited.
const LIMITED = {
  [FEATURES.JOIN_CIRCLE]: { action: 'join_circle', key: 'circle_joins', windowHours: 72, max: 2 },
  [FEATURES.JOIN_EXPERIENCE]: { action: 'join_experience', key: 'experience_joins', windowHours: 72, max: 2 },
  [FEATURES.CONNECTION_REQUEST]: { action: 'connection_request', key: 'connection_requests', windowHours: 72, max: 2 },
  [FEATURES.HOST_EXPERIENCE]: { action: 'join_experience', key: 'experience_joins', windowHours: 72, max: 1 },
};

// Free members get 3 concierge requests per 24 hours. Premium = unlimited.
const EXPLORER_CONCIERGE_LIMIT = 3;
const EXPLORER_CONCIERGE_WINDOW = 24;

const EXPLORER_VISIBLE_REQUESTS = 2;

function countRecent(arr, windowHours, nowMs = Date.now()) {
  const windowMs = windowHours * 3600000;
  return (Array.isArray(arr) ? arr : []).filter((ts) => {
    const t = new Date(ts).getTime();
    return Number.isFinite(t) && nowMs - t < windowMs;
  }).length;
}

/**
 * Request permission for a feature. Returns a decision object — never throws.
 * UI must never hardcode tier checks; always call this (or hasPermission).
 * Returns: { allowed, reason, feature, used?, limit?, remaining?, windowHours?, visibleCount? }
 */
export function requestPermission(feature, membership, context = {}) {
  if (isFounderAccessEnabled()) return { allowed: true, reason: 'founder_access', feature, unlimited: true };
  const tier = effectiveType(membership);

  if (tier === MEMBERSHIP_TYPES.premium) {
    return { allowed: true, reason: 'ok', feature, unlimited: true };
  }

  // Explorer
  if (PREMIUM_ONLY.has(feature)) {
    return { allowed: false, reason: 'premium_only', feature };
  }

  if (feature === FEATURES.VIEW_INCOMING_REQUESTS) {
    const idx = context.index ?? 0;
    const allowed = idx < EXPLORER_VISIBLE_REQUESTS;
    return { allowed, reason: allowed ? 'ok' : 'premium_only', feature, visibleCount: EXPLORER_VISIBLE_REQUESTS };
  }

  if (feature === FEATURES.VIEW_FULL_PROFILE) {
    const allowed = !!context.isConnected;
    return { allowed, reason: allowed ? 'ok' : 'premium_only', feature };
  }

  if (feature === FEATURES.PRIVATE_MESSAGING) {
    const isPal = !!context.isPal;
    const eitherPremium = !!context.viewerPremium || !!context.otherPremium;
    const allowed = isPal && eitherPremium;
    return { allowed, reason: allowed ? 'ok' : (isPal ? 'premium_required' : 'pals_required'), feature };
  }

  const limit = LIMITED[feature];
  if (limit) {
    const used = countRecent(membership?.[limit.key], limit.windowHours);
    const remaining = Math.max(0, limit.max - used);
    if (used < limit.max) {
      return { allowed: true, reason: 'ok', feature, used, limit: limit.max, remaining, windowHours: limit.windowHours };
    }
    return { allowed: false, reason: 'limit_reached', feature, used, limit: limit.max, remaining: 0, windowHours: limit.windowHours };
  }

  return { allowed: true, reason: 'ok', feature };
}

/** Boolean convenience for simple checks. */
export function hasPermission(feature, membership, context = {}) {
  return requestPermission(feature, membership, context).allowed;
}

/** Remaining quota for a limited feature, or unlimited for premium. */
export function remainingLimit(feature, membership) {
  if (isFounderAccessEnabled()) return { unlimited: true, remaining: Infinity, used: 0, limit: null, windowHours: null };
  const tier = effectiveType(membership);
  if (tier === MEMBERSHIP_TYPES.premium) {
    return { unlimited: true, remaining: Infinity, used: 0, limit: null, windowHours: null };
  }
  const limit = LIMITED[feature];
  if (!limit) {
    return { unlimited: false, remaining: 0, used: 0, limit: 0, windowHours: null };
  }
  const used = countRecent(membership?.[limit.key], limit.windowHours);
  return { unlimited: false, remaining: Math.max(0, limit.max - used), used, limit: limit.max, windowHours: limit.windowHours };
}