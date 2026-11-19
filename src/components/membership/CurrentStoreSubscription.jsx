import React, { useState } from 'react';
import { subscriptionName } from '@/lib/subscription-display';
import { membershipDate } from '@/lib/membership-presentation';
import { openManageSubscriptions } from '@/lib/revenuecat-client';
import { withTimeout } from '@/lib/bounded-operation';
export default function CurrentStoreSubscription({ info, products = [] }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  if (!info?.hasActiveSubscription) return null;
  const product = products.find(p => p.productId === info.productId);
  const date = membershipDate(info.renewalDate);
  const manage = async () => {
    if (busy) return;
    setBusy(true); setError(false);
    try { await withTimeout(() => openManageSubscriptions()); } catch { setError(true); } finally { setBusy(false); }
  };
  return <section aria-label="Current subscription" className="space-y-3 rounded-2xl border border-primary/20 p-4">
    <h2 className="font-semibold">Current plan: {subscriptionName(product || info)}</h2>
    {date && <p>{info.willRenew === true ? 'Renews' : 'Active until'} {date}</p>}
    <p>Your subscription is active. Do not purchase it again. The store confirms available plan changes.</p>
    <button type="button" disabled={busy} onClick={manage} className="min-h-11 rounded-xl border px-4 font-semibold">Manage subscription</button>
    {error && <p role="alert">The subscription store could not be opened. Please try again.</p>}
  </section>;
}
