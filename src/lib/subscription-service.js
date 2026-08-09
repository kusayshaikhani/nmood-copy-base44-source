// MP-005 Subscription Service (client) — orchestrates the native purchase /
// restore / sync flow against the subscriptionService backend, which is the
// secure source of truth. Updates flow into the MembershipProvider (which
// feeds the Permission Engine). Never trusts client-only state.

import { base44 } from '@/api/base44Client';
import {
  purchaseProduct,
  getAvailableReceipts,
  openSubscriptionManagement,
  detectStore,
} from '@/lib/native-billing-bridge';
import { showSubscriptionToast, SUBSCRIPTION_EVENTS } from '@/lib/subscription-notifications';
import { isPaidSubscriptionsEnabled } from '@/lib/launch-mode';

// Founder Access launch guard — when PAID_SUBSCRIPTIONS_ENABLED is false,
// every checkout, purchase, restore, sync, and manage-subscription action
// fails closed immediately. No transaction is ever started on native or
// web/preview. The IAP architecture is preserved for a later release.
const SUBSCRIPTIONS_DISABLED = { ok: false, event: 'subscriptions_disabled', provider: null, toastEvent: null };

export const MEMBERSHIP_CHANGED_EVENT = 'nmood:membership-changed';

export function emitMembershipChanged(detail) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(MEMBERSHIP_CHANGED_EVENT, { detail }));
}

function resolveProvider(provider) {
  return provider || detectStore() || 'apple';
}

/**
 * Purchase a plan through the native store, validate server-side, and return
 * the updated membership. Never throws technical errors to the UI.
 * @returns {Promise<{ ok, membership, event, provider, toastEvent }>}
 */
export async function subscriptionPurchase({ user, planId, provider }) {
  if (!isPaidSubscriptionsEnabled()) return { ...SUBSCRIPTIONS_DISABLED };
  if (!user?.id) return { ok: false, event: 'no_user', toastEvent: SUBSCRIPTION_EVENTS.RENEWAL_FAILED };
  const store = resolveProvider(provider);
  const purchase = await purchaseProduct(store, planId);
  if (!purchase.ok) {
    // User dismissed or purchase failed — gentle, never technical.
    return { ok: false, event: 'cancelled', provider: store };
  }
  if (purchase.simulated) {
    // Remember for restore in dev/preview.
    try { sessionStorage.setItem('nmood_dev_purchase', purchase.productId); } catch { /* ignore */ }
  }
  try {
    const resp = await base44.functions.invoke('subscriptionService', {
      mode: 'purchase',
      provider: store,
      planId,
      receipt: purchase.receipt,
    });
    const data = resp?.data || resp;
    if (data?.ok) {
      return { ok: true, membership: data.membership, event: data.event, provider: data.provider || store };
    }
    if (data?.event === 'entitlement_conflict') {
      return { ok: false, event: 'entitlement_conflict', provider: store, toastEvent: SUBSCRIPTION_EVENTS.RENEWAL_FAILED };
    }
    return { ok: false, event: data?.event || 'failed', provider: store, toastEvent: SUBSCRIPTION_EVENTS.RENEWAL_FAILED };
  } catch {
    return { ok: false, event: 'error', provider: store, toastEvent: SUBSCRIPTION_EVENTS.RENEWAL_FAILED };
  }
}

/**
 * Restore prior purchases. If a valid entitlement exists it is granted to the
 * current user (cross-device, no duplicate memberships, no support ticket).
 */
export async function subscriptionRestore({ user, provider }) {
  if (!isPaidSubscriptionsEnabled()) return { ...SUBSCRIPTIONS_DISABLED };
  if (!user?.id) return { ok: false, event: 'no_user' };
  const store = resolveProvider(provider);
  const receipts = await getAvailableReceipts(store);
  const firstReceipt = receipts[0] || null;
  try {
    const resp = await base44.functions.invoke('subscriptionService', {
      mode: 'restore',
      provider: store,
      receipts,
      receipt: firstReceipt,
      transactionId: firstReceipt?.transactionId || null,
    });
    const data = resp?.data || resp;
    return {
      ok: !!data?.ok,
      membership: data?.membership || null,
      event: data?.event || 'no_active_subscription',
      provider: data?.provider || store,
      toastEvent: data?.ok ? SUBSCRIPTION_EVENTS.RESTORED : SUBSCRIPTION_EVENTS.NO_SUBSCRIPTION,
    };
  } catch {
    return { ok: false, event: 'error', provider: store, toastEvent: SUBSCRIPTION_EVENTS.NO_SUBSCRIPTION };
  }
}

/**
 * Silent background sync — reconcile entitlement from receipts the client
 * holds, or fall back to expiry-based reconciliation server-side. Never
 * blocks UI; caller should not await on the critical path.
 */
export async function subscriptionSync({ user, provider, receipts }) {
  if (!isPaidSubscriptionsEnabled()) return { ok: false };
  if (!user?.id) return { ok: false };
  const store = resolveProvider(provider);
  try {
    const resp = await base44.functions.invoke('subscriptionService', {
      mode: 'sync',
      provider: store,
      receipts: receipts || (await getAvailableReceipts(store)),
    });
    const data = resp?.data || resp;
    return { ok: !!data?.ok, membership: data?.membership, event: data?.event, provider: data?.provider };
  } catch {
    return { ok: false };
  }
}

export function manageSubscription(provider) {
  if (!isPaidSubscriptionsEnabled()) return;
  openSubscriptionManagement(resolveProvider(provider));
}