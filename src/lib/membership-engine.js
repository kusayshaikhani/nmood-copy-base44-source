// MP-001 Central Membership Engine — single source of truth for membership state.
// All membership decisions (status, tier, expiry, usage) flow through here.
// Permission *decisions* live in permission-engine.js, which reads from this engine.
// Payments are NOT implemented here; billing_platform is metadata only.

import { base44 } from '@/api/base44Client';
import { isFounderAccessEnabled } from '@/lib/launch-mode';

export const MEMBERSHIP_TYPES = { explorer: 'explorer', premium: 'premium' };

export const MEMBERSHIP_STATUS = {
  active: 'active',
  trial: 'trial',
  grace_period: 'grace_period',
  expired: 'expired',
  cancelled: 'cancelled',
};

export const BILLING_PLATFORMS = {
  apple: 'apple',
  google: 'google',
  manual: 'manual',
  admin: 'admin',
  unknown: 'unknown',
};

// ---------------------------------------------------------------------------
// Plan registry — extensible. Add future plans (family, business, organization,
// student, partner) by appending entries; engine logic needs no redesign.
// `tier` maps a plan to the effective tier used by the permission engine.
// ---------------------------------------------------------------------------
// Plan registry — 4 production auto-renewable subscription plans.
// `fallbackPrice` is ONLY used when the store cannot be reached (web/preview
// without a native bridge). The native paywall always fetches and displays
// store-localized prices via fetchProductDetails(); these fallbacks are
// never shown to native app users.
export const PLANS = [
  { id: 'explorer', label: 'Explorer', tier: 'explorer', price: 'Free', durationDays: null, isFree: true },
  { id: 'annual', label: '12 Months', tier: 'premium', durationDays: 365, fallbackPrice: 'USD 39.99', fallbackPerMonth: 'USD 3.33', badge: 'best_value', bestValue: true },
  { id: 'halfyear', label: '6 Months', tier: 'premium', durationDays: 180, fallbackPrice: 'USD 24.99', fallbackPerMonth: 'USD 4.17' },
  { id: 'quarterly', label: '3 Months', tier: 'premium', durationDays: 90, fallbackPrice: 'USD 12.99', fallbackPerMonth: 'USD 4.33' },
  { id: 'monthly', label: '1 Month', tier: 'premium', durationDays: 30, fallbackPrice: 'USD 4.99', badge: 'most_flexible' },
];

export function getPlan(id) {
  return PLANS.find((p) => p.id === id) || null;
}

// ---------------------------------------------------------------------------
// Member state helpers — operate on the cached Membership record. Pure, no I/O.
// ---------------------------------------------------------------------------
export function getCurrentPlan(m) {
  return m?.type || MEMBERSHIP_TYPES.explorer;
}

export function getStatus(m) {
  return m?.status || MEMBERSHIP_STATUS.active;
}

export function isActive(m) { return getStatus(m) === MEMBERSHIP_STATUS.active; }
export function isTrial(m) { return getStatus(m) === MEMBERSHIP_STATUS.trial; }
export function isGracePeriod(m) { return getStatus(m) === MEMBERSHIP_STATUS.grace_period; }
export function isExpired(m) { return getStatus(m) === MEMBERSHIP_STATUS.expired; }
export function isCancelled(m) { return getStatus(m) === MEMBERSHIP_STATUS.cancelled; }

export function getStartDate(m) { return m?.started_date || null; }
export function getExpiryDate(m) { return m?.expires_at || null; }
export function getRenewalDate(m) { return m?.renewal_date || m?.expires_at || null; }

export function getBillingPlatform(m) {
  const v = m?.billing_platform || m?.payment_provider || BILLING_PLATFORMS.unknown;
  return Object.values(BILLING_PLATFORMS).includes(v) ? v : BILLING_PLATFORMS.unknown;
}

export function daysRemaining(m, nowMs = Date.now()) {
  const exp = m?.expires_at ? new Date(m.expires_at).getTime() : null;
  if (exp === null || Number.isNaN(exp)) return null;
  return Math.max(0, Math.ceil((exp - nowMs) / 86400000));
}

// Effective tier: a premium plan counts as premium only while active, trial,
// or in grace period. Expired/cancelled premium reverts to explorer entitlements.
export function effectiveType(m) {
  if (isFounderAccessEnabled()) return MEMBERSHIP_TYPES.premium;
  if (!m) return MEMBERSHIP_TYPES.explorer;
  if (m.type !== MEMBERSHIP_TYPES.premium) return MEMBERSHIP_TYPES.explorer;
  const s = getStatus(m);
  if (s === MEMBERSHIP_STATUS.active || s === MEMBERSHIP_STATUS.trial || s === MEMBERSHIP_STATUS.grace_period) {
    return MEMBERSHIP_TYPES.premium;
  }
  return MEMBERSHIP_TYPES.explorer;
}

export function isPremium(m) {
  return effectiveType(m) === MEMBERSHIP_TYPES.premium;
}

// ---------------------------------------------------------------------------
// Store-transaction validation HELPER — NOT yet enforced in the Premium-access
// decision. Before real payments launch, Premium must be granted only after
// trusted backend server verification confirms: provider is Apple or Google,
// transaction ID exists, product ID matches an approved Nmood product,
// subscription status is active or valid, and expiry/revocation information is
// respected. Actual Apple/Google server verification remains a future launch
// blocker. The current legacy/test membership preserves its existing test
// access and is not affected by this helper.
// ---------------------------------------------------------------------------
const SUPPORTED_STORE_PROVIDERS = new Set(['apple', 'google']);

export function hasVerifiedStoreTransaction(m) {
  if (!m || m.type !== MEMBERSHIP_TYPES.premium) return false;
  const provider = m.payment_provider || m.billing_platform;
  if (!provider || !SUPPORTED_STORE_PROVIDERS.has(String(provider).toLowerCase())) return false;
  return Boolean(m.store_transaction_id && m.store_product_id && m.status && m.started_date);
}

// Legacy/test membership: premium without a verified store transaction.
// These records are not modified or deleted — they are clearly marked in the
// UI and cannot trigger Apple, Google, or Stripe cancellation flows.
export function isLegacyMembership(m) {
  if (!m || m.type !== MEMBERSHIP_TYPES.premium) return false;
  return !hasVerifiedStoreTransaction(m);
}

export function formatRenewalDate(m) {
  const d = getRenewalDate(m);
  if (!d) return null;
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return null;
  return dt.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

// ---------------------------------------------------------------------------
// Persistence — ensure every user has exactly one membership record (Explorer).
// ---------------------------------------------------------------------------
export async function ensureMembership(user) {
  if (isFounderAccessEnabled()) {
    return { type: MEMBERSHIP_TYPES.premium, status: MEMBERSHIP_STATUS.active, billing_platform: BILLING_PLATFORMS.unknown, membership_source: 'founder_access' };
  }
  if (!user?.id) return null;
  try {
    const existing = await base44.entities.Membership.filter({ user_id: String(user.id) });
    if (existing.length > 0) return existing[0];
    return await base44.entities.Membership.create({
      user_id: String(user.id),
      type: MEMBERSHIP_TYPES.explorer,
      status: MEMBERSHIP_STATUS.active,
      started_date: new Date().toISOString().slice(0, 10),
      billing_platform: BILLING_PLATFORMS.unknown,
    });
  } catch {
    return null;
  }
}

export async function getMembership(user) {
  return ensureMembership(user);
}

export async function upgradeToPremium(user, planId, provider = 'apple') {
  if (!user?.id) return null;
  const plan = getPlan(planId) || getPlan('monthly');
  const membership = await ensureMembership(user);
  if (!membership) return null;
  const now = new Date();
  const expires = new Date(now.getTime() + (plan.durationDays || 30) * 86400000);
  const billing = provider === 'apple' ? BILLING_PLATFORMS.apple
    : provider === 'google' ? BILLING_PLATFORMS.google
    : provider === 'admin' ? BILLING_PLATFORMS.admin
    : BILLING_PLATFORMS.manual;
  try {
    return await base44.entities.Membership.update(membership.id, {
      type: MEMBERSHIP_TYPES.premium,
      status: MEMBERSHIP_STATUS.active,
      plan: planId,
      started_date: now.toISOString().slice(0, 10),
      expires_at: expires.toISOString(),
      renewal_date: expires.toISOString(),
      cancelled_at: null,
      payment_provider: provider,
      billing_platform: billing,
      auto_renew: true,
    });
  } catch {
    return null;
  }
}

export async function cancelMembership(user) {
  const membership = await ensureMembership(user);
  if (!membership) return null;
  try {
    return await base44.entities.Membership.update(membership.id, {
      type: MEMBERSHIP_TYPES.explorer,
      status: MEMBERSHIP_STATUS.cancelled,
      plan: '',
      cancelled_at: new Date().toISOString(),
      expires_at: '',
      renewal_date: '',
      auto_renew: false,
    });
  } catch {
    return null;
  }
}

// Interface stub: restore a prior purchase. Payments not implemented; returns
// the current membership record.
export async function restoreMembership(user) {
  return ensureMembership(user);
}

// ---------------------------------------------------------------------------
// Usage limiting — 72h sliding windows for Explorer-limited actions.
// ---------------------------------------------------------------------------
const USAGE_WINDOW_MS = 72 * 3600000;

function usageKey(action) {
  if (action === 'join_circle') return 'circle_joins';
  if (action === 'join_experience') return 'experience_joins';
  if (action === 'connection_request') return 'connection_requests';
  return null;
}

export function usageCount(membership, action, nowMs = Date.now()) {
  const key = usageKey(action);
  if (!key) return 0;
  return (Array.isArray(membership?.[key]) ? membership[key] : []).filter((ts) => {
    const t = new Date(ts).getTime();
    return Number.isFinite(t) && nowMs - t < USAGE_WINDOW_MS;
  }).length;
}

export function appendUsage(membership, action, nowMs = Date.now()) {
  const key = usageKey(action);
  if (!key) return membership;
  const arr = (Array.isArray(membership[key]) ? membership[key] : []).filter((ts) => {
    const t = new Date(ts).getTime();
    return Number.isFinite(t) && nowMs - t < USAGE_WINDOW_MS;
  });
  arr.push(new Date(nowMs).toISOString());
  return { ...membership, [key]: arr };
}

export async function persistUsage(membership, action) {
  if (!membership?.id) return membership;
  const key = usageKey(action);
  if (!key) return membership;
  const updated = appendUsage(membership, action);
  try {
    return await base44.entities.Membership.update(membership.id, { [key]: updated[key] });
  } catch {
    return updated;
  }
}