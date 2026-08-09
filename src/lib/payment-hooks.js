// Payment hook INTERFACES only. No payment processing in RC1.
// Prepared for Apple, Google, and Stripe. Each returns a structured placeholder
// so the membership flow can be wired now and swapped for a live backend later.

// Digital subscriptions MUST use Apple IAP / Google Play Billing (Apple
// Guideline 3.1.1, Google Play Payments policy). Stripe is NOT used for
// digital goods and must not be offered inside the native app.
export const PAYMENT_PROVIDERS = {
  apple: { id: 'apple', name: 'Apple', label: 'Apple App Store' },
  google: { id: 'google', name: 'Google', label: 'Google Play Store' },
};

/**
 * Initiate a purchase for the given plan via the chosen provider.
 * Interface only — returns a simulated receipt for RC1.
 * @returns {Promise<{ status: 'pending'|'success'|'error', provider, planId, receiptId, simulated }>}
 */
export async function purchaseMembership({ provider, planId }) {
  return {
    status: 'success',
    provider,
    planId,
    receiptId: `rc1_${provider}_${planId}_${Date.now()}`,
    simulated: true,
  };
}

/**
 * Restore a previous purchase for the given provider.
 * Interface only — returns a simulated restore result for RC1.
 */
export async function restorePurchase({ provider }) {
  return {
    status: 'restored',
    provider,
    active: false, // no prior live purchase to restore in RC1
    simulated: true,
  };
}

/**
 * Cancel an active subscription via the given provider.
 * Interface only — returns a simulated cancel result for RC1.
 */
export async function cancelSubscription({ provider }) {
  return {
    status: 'cancelled',
    provider,
    simulated: true,
  };
}