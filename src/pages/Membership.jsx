import PremiumPlans from '@/components/membership/premium/PremiumPlans';
import WebPurchasePrompt from '@/components/membership/WebPurchasePrompt';
import CurrentStoreSubscription from '@/components/membership/CurrentStoreSubscription';
import { useStoreSubscription } from '@/lib/use-store-subscription';
import { subscriptionName } from '@/lib/subscription-display';
import React, { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Link } from 'react-router-dom';
import { useMembershipAccess } from '@/components/membership/MembershipProvider';
import { getAvailableProducts } from '@/lib/revenuecat-client';
import { openManageMembership } from '@/lib/membership-revenuecat';
import { withTimeout } from '@/lib/bounded-operation';
import { membershipDate, renewalIsDue } from '@/lib/membership-presentation';

function NativeMembership() {
  const { administratorAccess, membership, isPremium, loading, initializingStore = false, entitlementState, sync, restore, purchase } = useMembershipAccess();
  const store = useStoreSubscription(administratorAccess || loading || initializingStore);
  const [products, setProducts] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [planAction, setPlanAction] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const purchasable = products.filter(product => product.rcPackage?.product?.identifier && product.productId && product.localizedPrice && (!store.info?.hasActiveSubscription || product.productId !== store.info.productId));
  const selected = purchasable.find(product => product.id === selectedPlan);
  const openPlans = action => { setPlanAction(action); setSelectedPlan(null); setNotice(''); };
  const purchaseSelected = async () => {
    if (busy || store.loading || store.error || !selected || !Capacitor.isNativePlatform()) return;
    if (store.info?.hasActiveSubscription) { await storeAction(); return; }
    setBusy(true); setNotice('');
    try {
      const result = await purchase(selected.rcPackage);
      setNotice(result ? `${subscriptionName(selected)} purchase confirmed. Your membership status has been refreshed.` : 'The purchase was not confirmed. No membership change has been assumed. Please retry when ready.');
    } catch { setNotice('This plan could not be purchased. Please try again shortly.'); }
    finally {
      const refreshed = await store.refresh();
      if (refreshed?.hasActiveSubscription) setNotice(`${subscriptionName(products.find(p => p.productId === refreshed.productId) || refreshed)} is your current subscription. Use Manage subscription to review it.`);
      setBusy(false);
    }
  };
  useEffect(() => {
    if (administratorAccess || loading || initializingStore) return undefined;
    let active = true;
    setPlansLoading(true); setPlansError(false);
    // Re-run native setup before reading products. This closes the gap where
    // a prior background setup failed and left the screen at NOT_INITIALIZED.
    withTimeout(async () => {
      await sync?.();
      return getAvailableProducts({ fresh: true });
    }).then(rows => { if (active) setProducts(Array.isArray(rows) ? rows.filter(Boolean) : []); })
      .catch(() => { if (active) setPlansError(true); })
      .finally(() => { if (active) setPlansLoading(false); });
    return () => { active = false; };
  }, [administratorAccess, loading, initializingStore, attempt, sync]);
  const expiry = membershipDate(store.info?.hasActiveSubscription ? store.info.renewalDate : membership?.expires_at || membership?.renewal_date);
  const current = products.find(product => product.productId === membership?.product_id);
  const storeAction = async () => {
    if (busy) return;
    setBusy(true); setNotice('');
    try { await withTimeout(() => openManageMembership()); }
    catch { setNotice('The subscription store could not be opened. Please retry or manage subscriptions in your device settings.'); }
    finally { setBusy(false); }
  };
  const restoreAction = async () => {
    if (busy) return;
    setBusy(true);
    try { const result = await withTimeout(() => restore(), 20000); setNotice(result?.type === 'premium' ? 'Premium membership restored.' : 'No active membership was confirmed. You can retry verification.'); }
    catch { setNotice('Purchases could not be restored. Please retry.'); }
    finally { await store.refresh(); setBusy(false); }
  };
  const button = 'min-h-11 rounded-xl border border-border px-4 py-3 text-sm font-semibold disabled:opacity-50';
  if (administratorAccess) return <main className="mx-auto max-w-2xl space-y-4 p-6" aria-label="Administrator access"><h1 className="text-2xl font-bold">Administrator access</h1><p>Your administrator role includes paid features. No subscription is required for administrator use. Member privacy and blocking rules still apply.</p><Link className="inline-flex min-h-11 items-center text-primary" to="/profile">Back to My Profile</Link></main>;
  return <main className="mx-auto max-w-2xl space-y-6 p-4 pb-28" aria-label="Manage Membership">
    <h1 className="text-2xl font-bold">Manage Membership</h1>
    <CurrentStoreSubscription info={store.info} products={products}/>
    {store.loading && <p role="status">Checking current subscription…</p>}
    {store.error && <div role="status"><p>Subscription status could not be refreshed. Retry before purchasing.</p><button type="button" className={button} onClick={store.refresh}>Retry subscription check</button></div>}
    {loading ? <p role="status">Checking membership…</p> : <section className="space-y-3 rounded-2xl border p-5">
      <h2 className="text-xl font-semibold">{isPremium ? 'Premium' : entitlementState === 'unavailable' ? 'Membership unavailable' : 'Explorer'}</h2>
      {entitlementState !== 'unavailable' && !store.info?.hasActiveSubscription && <p>Current plan: {isPremium ? subscriptionName(current || membership) : 'Explorer'}</p>}
      {isPremium && <p>{expiry ? `${membership?.auto_renew === true ? 'Renews' : 'Active until'} ${expiry}.` : 'No expiry date has been provided.'}</p>}
      {isPremium && expiry && <p className="text-sm text-muted-foreground">Your renewal reminder is scheduled for 72 hours before expiry. Push delivery is best-effort.</p>}
      {isPremium && membership?.auto_renew === false && <p>Automatic renewal is off. Your membership remains active until {expiry || 'the end of your paid period'}.</p>}
      {isPremium && renewalIsDue(membership) && <p role="status">Your current paid period ends within 72 hours. You can review renewal at any time.</p>}
      {isPremium ? <div className="flex flex-wrap gap-3">
        <button type="button" disabled={busy} className={button} onClick={() => openPlans('Renew')}>Renew</button>
        <button type="button" disabled={busy} className={button} onClick={() => openPlans('Change plan')}>Change plan</button>
        {/* Store subscription controls above remain separate from server app access. */}
        {membership?.billing_platform === 'google' && <button type="button" disabled={busy} className={button} onClick={storeAction}>Manage Google Play subscription</button>}
      </div> : !store.loading && !store.error && !store.info?.hasActiveSubscription && entitlementState !== 'unavailable' && <div><p className="mb-3 text-sm">Premium includes continued discovery, full permitted profiles, and participation.</p><Link className={`${button} inline-flex items-center text-primary`} to="/upgrade">Upgrade</Link></div>}
      {isPremium && <p className="text-sm text-muted-foreground">Choosing not to renew does not end your current paid period. Renewal and plan changes are confirmed in the subscription store.</p>}
    </section>}
    {(entitlementState === 'unavailable' || entitlementState === 'reconciling') && <div role="status" className="space-y-2 text-sm"><p>{entitlementState === 'reconciling' ? 'Refreshing membership status…' : 'Membership status could not be refreshed. Your last verified status is shown.'}</p><button type="button" disabled={entitlementState === 'reconciling'} onClick={() => sync()} className={button}>Retry verification</button></div>}
    {planAction && <section aria-label={`${planAction} membership`} className="rounded-2xl border p-5 space-y-3">
      <h2 className="text-lg font-semibold">{planAction}: choose a plan</h2>
      <p className="text-sm">Review Nmood’s available plans here. The store confirms purchase eligibility, price, and when any change takes effect.</p>
      {plansLoading || store.loading ? <p role="status">Loading purchasable plans…</p> : store.error || plansError || !purchasable.length || !Capacitor.isNativePlatform()
        ? <p role="status">No purchasable plan is currently available on this device. Your existing membership remains unchanged. Use Retry plans below to check again.</p>
        : <><div role="group" aria-label="Purchasable plans" className="grid gap-3 sm:grid-cols-2">{purchasable.map(product => <button type="button" key={product.id} disabled={busy} aria-pressed={selectedPlan === product.id} className={`${button} text-left ${selectedPlan === product.id ? 'border-primary' : ''}`} onClick={() => setSelectedPlan(product.id)}>{subscriptionName(product)} · {product.localizedPrice}</button>)}</div>
        <button type="button" className={button} disabled={busy || store.loading || store.error || !selected} onClick={purchaseSelected}>{busy ? 'Processing…' : store.info?.hasActiveSubscription ? 'Review change in store' : 'Continue with selected plan'}</button></>}
    </section>}
    <section className="space-y-3" aria-label="Available plan durations"><h2 className="text-lg font-semibold">Available plan durations</h2>
      {plansLoading ? <p role="status">Loading available plans…</p> : plansError || !products.length ? <div><p>Plans are currently unavailable.</p><button type="button" className={button} onClick={async () => { await sync(); setAttempt(value => value + 1); }}>Retry plans</button></div> : <ul className="grid gap-3 sm:grid-cols-2">{products.map(product => <li key={product.id} className="rounded-xl border p-4 break-words"><p className="font-semibold">{subscriptionName(product)}</p><p>{product.localizedPrice}</p>{store.info?.hasActiveSubscription && product.productId === store.info.productId && <p>Current plan</p>}</li>)}</ul>}
      {!plansError && products.length > 0 && planAction && <button type="button" className={button} disabled={plansLoading || busy} onClick={() => { setSelectedPlan(null); setAttempt(value => value + 1); }}>Retry plans</button>}
    </section>
    <button type="button" className={button} disabled={busy || loading} onClick={restoreAction}>Restore purchases</button>
    {notice && <p role="status">{notice}</p>}
    <div className="flex flex-wrap gap-4 text-sm text-primary"><Link to="/subscription-terms">Subscription Terms</Link><Link to="/refund-policy">Refund Policy</Link><Link to="/help">Help</Link></div>
  </main>;
}

function WebMembership() {
  const { administratorAccess, isPremium } = useMembershipAccess();
  const [open, setOpen] = useState(false);
  if (administratorAccess) return <main className="mx-auto max-w-2xl space-y-4 p-6" aria-label="Administrator access"><h1 className="text-2xl font-bold">Administrator access</h1><p>Your administrator role includes paid features. No subscription is required for administrator use. Member privacy and blocking rules still apply.</p><Link className="inline-flex min-h-11 items-center text-primary" to="/profile">Back to My Profile</Link></main>;
  return <main className="mx-auto max-w-2xl space-y-6 p-4 pb-28" aria-label="Manage Membership">
    <h1 className="text-2xl font-bold">Manage Membership</h1>
    <PremiumPlans/>
    <p className="text-sm text-muted-foreground">Purchases, restoration, and subscription changes are managed in the Nmood mobile app. Your verified Premium access is available on the web with the same account.</p>
    {isPremium && <button type="button" className="min-h-11 rounded-xl border border-border px-4 py-3 text-sm font-semibold" onClick={() => setOpen(true)}>Manage subscription in the Nmood app</button>}
    <WebPurchasePrompt open={open} onOpenChange={setOpen}/>
    <div className="flex flex-wrap gap-4 text-sm text-primary"><Link to="/subscription-terms">Subscription Terms</Link><Link to="/refund-policy">Refund Policy</Link><Link to="/help">Help</Link></div>
  </main>;
}
export default function Membership() {
  return Capacitor.isNativePlatform() ? <NativeMembership/> : <WebMembership/>;
}
