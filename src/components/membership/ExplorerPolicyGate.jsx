import PremiumMoment from './PremiumMoment';
import { MAIN_PASSPORT } from '@/lib/passport/enabled';
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { EXPLORER_MESSAGES, useExplorerPolicy } from '@/lib/explorer-policy';

export function ExplorerLock({ incoming = false, compact = false }) {
  if (MAIN_PASSPORT) return <section aria-label={incoming?'Incoming request access':'Introduction allowance'} className="space-y-3 p-4">
    <p className="text-sm text-muted-foreground">{incoming?'Incoming request details are available with Premium.':'Your introduction allowance is used. You can wait for it to renew. Browsing and existing chats remain available.'}</p>
    <PremiumMoment moment={incoming?'incoming':'limit'}/>
    {!incoming && <Link to="/explore" className="inline-flex min-h-11 items-center text-sm font-medium text-primary">Keep exploring</Link>}
  </section>;
  if (incoming && compact) return <Link to="/upgrade" aria-label={EXPLORER_MESSAGES.incoming} className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"><Lock size={16} aria-hidden="true" />Upgrade</Link>;
  const content = <section role="status" className="m-4 rounded-2xl border border-primary/20 bg-card p-6 space-y-4">
    {incoming && <div aria-hidden="true" className="blur-md pointer-events-none select-none flex gap-3"><div className="h-12 w-12 rounded-full bg-muted" /><div className="h-10 w-32 rounded bg-muted" /></div>}
    <Lock className="text-primary" aria-hidden="true" />
    <h2 className="text-lg font-semibold">{incoming ? 'Request received' : 'Discovery is paused'}</h2>
    <p className="text-sm">{incoming ? EXPLORER_MESSAGES.incoming : EXPLORER_MESSAGES.discovery}</p>
    {incoming ? <span className="inline-flex min-h-[44px] items-center rounded-full bg-primary px-5 py-2 font-semibold text-primary-foreground">Upgrade</span> : <Link to="/upgrade" className="inline-flex min-h-[44px] items-center rounded-full bg-primary px-5 py-2 font-semibold text-primary-foreground">Upgrade</Link>}
  </section>;
  return incoming ? <Link to="/upgrade" className="block rounded-2xl focus-visible:ring-2 focus-visible:ring-primary">{content}</Link> : content;
}
// Only these routes are public discovery surfaces. The quota still protects
// the unrelated, pre-existing guarded routes through QuotaDiscoveryGate.
const publicDiscoveryRoute = path => path === '/' || /^\/(explore|search|discover-people|circle|experience)(\/|$)/.test(path);
const quotaRestrictedRoute = path => /^\/(my-experiences|saved|calendar|inmood|inmood-v2|community|communities|planner)(\/|$)/.test(path);
export default function ExplorerPolicyGate({ children }) {
  const { pathname } = useLocation();
  if (publicDiscoveryRoute(pathname)) return <DiscoveryGate>{children}</DiscoveryGate>;
  if (quotaRestrictedRoute(pathname)) return <QuotaDiscoveryGate>{children}</QuotaDiscoveryGate>;
  return children;
}
export function DiscoveryGate({ children }) {
  const query = useExplorerPolicy();
  if (query.data?.verification_pending || (query.isError && !query.data)) return <div role="alert" className="p-6"><p>{EXPLORER_MESSAGES.unavailable}</p><button type="button" className="min-h-[44px] text-primary" onClick={() => query.refetch()}>Retry</button></div>;
  if (!query.data) return <p role="status" className="p-6">Checking discovery access…</p>;
  // `discovery_locked` is the outgoing-request quota state. It never gates
  // the explicitly public browsing surfaces above; server RLS/RPCs remain
  // authoritative for every individual result.
  return <>{query.isError && <div role="status" className="p-4 text-sm">Discovery could not be refreshed. <button type="button" className="min-h-11 underline" onClick={() => query.refetch()}>Retry</button></div>}{children}</>;
}
export function QuotaDiscoveryGate({ children }) {
  const query = useExplorerPolicy();
  if (query.data?.verification_pending || (query.isError && !query.data)) return <div role="alert" className="p-6"><p>{EXPLORER_MESSAGES.unavailable}</p><button type="button" className="min-h-[44px] text-primary" onClick={() => query.refetch()}>Retry</button></div>;
  if (!query.data || (query.isFetching && query.data.discovery_locked)) return <p role="status" className="p-6">Checking discovery access…</p>;
  if (query.data.discovery_locked) return <ExplorerLock />;
  return <>{query.isError && <div role="status" className="p-4 text-sm">Discovery could not be refreshed. <button type="button" className="min-h-11 underline" onClick={() => query.refetch()}>Retry</button></div>}{children}</>;
}
export function IncomingRequestGate({ children, compact = false }) {
  const query = useExplorerPolicy();
  // Never mount sender data while the authoritative incoming permission is unknown.
  if (query.isError && !query.data) return <div role="alert" className="p-4"><p>Request access could not be verified. Please retry.</p><button type="button" className="min-h-[44px] text-primary" onClick={() => query.refetch()}>Retry</button></div>;
  if (!query.data || query.data.verification_pending || (query.isFetching && !query.data.premium)) return <p role="status" className="p-4">Checking request access…</p>;
  return query.data.premium ? children : <ExplorerLock incoming compact={compact} />;
}
