// MP-005 Subscription notifications — positive, respectful, never pressuring.
// Uses the global toast dispatcher. Technical errors are never shown; the
// friendly renewal-failed copy is used instead.

import { toast } from '@/components/ui/use-toast';

export const SUBSCRIPTION_EVENTS = {
  WELCOME: 'welcome',
  RENEWED: 'renewed',
  RENEWAL_FAILED: 'renewal_failed',
  GRACE_STARTED: 'grace_started',
  EXPIRED: 'expired',
  RESTORED: 'restored',
  CANCELLED: 'cancelled',
  CANCEL_INFO: 'cancel_info',
  NO_SUBSCRIPTION: 'no_subscription',
};

const COPY = {
  [SUBSCRIPTION_EVENTS.WELCOME]: {
    title: 'Welcome to Premium ✨',
    description: 'More opportunities. More experiences. Start Living.',
  },
  [SUBSCRIPTION_EVENTS.RENEWED]: {
    title: 'Premium renewed',
    description: 'Your membership was renewed. Enjoy another cycle of living.',
  },
  [SUBSCRIPTION_EVENTS.RENEWAL_FAILED]: {
    title: "We couldn't renew Premium",
    description: "No worries. We'll try again automatically. Update your payment method anytime.",
  },
  [SUBSCRIPTION_EVENTS.GRACE_STARTED]: {
    title: 'Premium grace period',
    description: 'Your benefits stay active while we retry your payment. No action needed yet.',
  },
  [SUBSCRIPTION_EVENTS.EXPIRED]: {
    title: 'Premium ended',
    description: "You're back on Explorer. Rejoin Premium anytime — we'll be here.",
  },
  [SUBSCRIPTION_EVENTS.RESTORED]: {
    title: 'Premium restored',
    description: 'Welcome back. Your membership is active again.',
  },
  [SUBSCRIPTION_EVENTS.CANCELLED]: {
    title: 'Premium cancelled',
    description: 'Your benefits remain until the current period ends.',
  },
  [SUBSCRIPTION_EVENTS.CANCEL_INFO]: {
    title: 'Manage in your store',
    description: 'Subscriptions are managed by Apple or Google. Your benefits continue until the period ends.',
  },
  [SUBSCRIPTION_EVENTS.NO_SUBSCRIPTION]: {
    title: 'No active subscription found',
    description: 'There’s nothing to restore right now. Explore Premium anytime.',
  },
};

let lastShown = {};
export function showSubscriptionToast(event, opts = {}) {
  // Avoid spamming the same event on repeated background syncs.
  const key = `${event}:${opts.dedupeKey || ''}`;
  if (opts.dedupe && lastShown[key] && Date.now() - lastShown[key] < 60_000) return;
  lastShown[key] = Date.now();
  const copy = COPY[event];
  if (!copy) return;
  toast({
    title: copy.title,
    description: copy.description,
    variant: event === SUBSCRIPTION_EVENTS.RENEWAL_FAILED || event === SUBSCRIPTION_EVENTS.EXPIRED ? 'destructive' : 'default',
  });
}

export function resetNotificationDedupe() {
  lastShown = {};
}