// MP-005 Subscription states. The Membership entity stores a canonical status
// (membership-engine MEMBERSHIP_STATUS); these are the richer subscription
// lifecycle states surfaced to the UI, derived from the stored status plus
// expiry / auto-renew signals.

export const SUBSCRIPTION_STATES = {
  EXPLORER: 'explorer',
  PREMIUM_ACTIVE: 'premium_active',
  PREMIUM_EXPIRING: 'premium_expiring',
  GRACE_PERIOD: 'grace_period',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
  PENDING: 'pending',
  REFUNDED: 'refunded',
  UNKNOWN: 'unknown',
};

// Derive the subscription lifecycle state from a cached Membership record.
export function deriveSubscriptionState(m) {
  if (!m) return SUBSCRIPTION_STATES.EXPLORER;
  if (m.type !== 'premium') {
    if (m.status === 'refunded') return SUBSCRIPTION_STATES.REFUNDED;
    if (m.status === 'cancelled') return SUBSCRIPTION_STATES.CANCELLED;
    if (m.status === 'expired') return SUBSCRIPTION_STATES.EXPIRED;
    return SUBSCRIPTION_STATES.EXPLORER;
  }
  if (m.status === 'grace_period') return SUBSCRIPTION_STATES.GRACE_PERIOD;
  if (m.status === 'trial') return SUBSCRIPTION_STATES.PREMIUM_ACTIVE;
  if (m.status === 'pending') return SUBSCRIPTION_STATES.PENDING;
  // active premium — detect "expiring" when auto-renew is off and within window
  if (m.auto_renew === false) return SUBSCRIPTION_STATES.PREMIUM_EXPIRING;
  return SUBSCRIPTION_STATES.PREMIUM_ACTIVE;
}

export function isPremiumEntitled(state) {
  return [
    SUBSCRIPTION_STATES.PREMIUM_ACTIVE,
    SUBSCRIPTION_STATES.PREMIUM_EXPIRING,
    SUBSCRIPTION_STATES.GRACE_PERIOD,
  ].includes(state);
}

export const SUBSCRIPTION_STATE_LABELS = {
  [SUBSCRIPTION_STATES.EXPLORER]: 'Explorer',
  [SUBSCRIPTION_STATES.PREMIUM_ACTIVE]: 'Premium Active',
  [SUBSCRIPTION_STATES.PREMIUM_EXPIRING]: 'Premium Expiring',
  [SUBSCRIPTION_STATES.GRACE_PERIOD]: 'Grace Period',
  [SUBSCRIPTION_STATES.EXPIRED]: 'Expired',
  [SUBSCRIPTION_STATES.CANCELLED]: 'Cancelled',
  [SUBSCRIPTION_STATES.PENDING]: 'Pending',
  [SUBSCRIPTION_STATES.REFUNDED]: 'Refunded',
  [SUBSCRIPTION_STATES.UNKNOWN]: 'Unknown',
};