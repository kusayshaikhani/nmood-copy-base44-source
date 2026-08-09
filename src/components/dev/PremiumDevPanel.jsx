import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useMembershipAccess } from '@/components/membership/MembershipProvider';
import { effectiveType, getStatus } from '@/lib/membership-engine';

/**
 * TEMPORARY DEV-ONLY premium entitlement verifier.
 *
 * Surfaces every source that marks the current user as premium side-by-side so
 * a mismatch (stale cache / wrong field mapping / wrong user↔member linkage /
 * inconsistent checks) is visible at a glance. Rendered only when the URL
 * carries `?dev=premium` AND Vite is in dev mode — never ships to production.
 *
 * Remove this file once the entitlement bug is fixed.
 */

function Row({ label, value, ok, warn }) {
  const color = warn ? 'text-destructive' : ok === false ? 'text-destructive' : ok === true ? 'text-success' : 'text-foreground';
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 border-b border-border/40 last:border-0">
      <span className="text-xs font-medium text-muted-foreground shrink-0">{label}</span>
      <span className={`text-xs font-mono text-end break-all ${color}`}>{value}</span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-soft">
      <h3 className="text-xs font-bold uppercase tracking-wide text-foreground mb-2">{title}</h3>
      {children}
    </div>
  );
}

export default function PremiumDevPanel({ profileRes, routeId }) {
  const { user } = useAuth();
  const { membership, isPremium, type, membershipStatus } = useMembershipAccess();
  const [serverPremium, setServerPremium] = useState(null);
  const [serverChecking, setServerChecking] = useState(false);
  const [rawMemberships, setRawMemberships] = useState(null);

  // Live backend premium verdict (the same call useServerPremium makes).
  useEffect(() => {
    let cancelled = false;
    setServerChecking(true);
    base44.functions
      .invoke('authorizationGate', { action: 'getMatchExplanation' })
      .then((res) => { if (!cancelled) setServerPremium(res?.data?.premium ?? res?.premium ?? null); })
      .catch(() => { if (!cancelled) setServerPremium('ERROR'); })
      .finally(() => { if (!cancelled) setServerChecking(false); });
    // Also pull ALL membership rows for this user to detect duplicates / linkage issues.
    if (user?.id) {
      base44.entities.Membership.filter({ user_id: String(user.id) })
        .then((rows) => { if (!cancelled) setRawMemberships(rows || []); })
        .catch(() => { if (!cancelled) setRawMemberships('ERROR'); });
    }
    return () => { cancelled = true; };
  }, [user?.id]);

  if (!import.meta.env.DEV) return null;
  const params = new URLSearchParams(window.location.search);
  if (!params.has('dev') || params.get('dev') !== 'premium') return null;

  const linkageOk = !!(membership?.user_id && user?.id && String(membership.user_id) === String(user.id));
  const clientVsServer = isPremium === serverPremium ? null : isPremium; // null = consistent
  const profileTier = profileRes?.tier || '(none)';
  const profilePremium = profileRes?.premium;
  const profileConnected = profileRes?.connected;
  // A 'full' tier with no connection should imply premium; mismatch if not.
  const tierImpliesPremium = profileTier === 'full' && !profileConnected;

  return (
    <div className="fixed bottom-20 end-2 z-50 w-[92vw] max-w-md max-h-[80vh] overflow-y-auto rounded-2xl border-2 border-primary/40 bg-background/95 backdrop-blur-xl shadow-dialog p-3 space-y-2 text-xs">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-primary">DEV · Premium Entitlement Verifier</h2>
        <span className="text-[10px] text-muted-foreground">?dev=premium</span>
      </div>

      <Section title="1 · Auth user (viewer)">
        <Row label="user.id" value={user?.id || '(none)'} />
        <Row label="email" value={user?.email || '(none)'} />
        <Row label="role" value={user?.role || '(none)'} />
      </Section>

      <Section title="2 · Cached Membership record (client source)">
        <Row label="membership.id" value={membership?.id || '(none)'} />
        <Row label="membership.user_id" value={membership?.user_id || '(none)'} />
        <Row label="membership.type" value={membership?.type || '(none)'} />
        <Row label="membership.status" value={membership?.status || '(none)'} />
        <Row label="membership.expires_at" value={membership?.expires_at || '(none)'} />
        <Row label="membership.billing_platform" value={membership?.billing_platform || '(none)'} />
        <Row label="membership.membership_source" value={membership?.membership_source || '(none)'} />
      </Section>

      <Section title="3 · Client premium computation">
        <Row label="effectiveType(membership)" value={effectiveType(membership)} />
        <Row label="getStatus(membership)" value={getStatus(membership)} />
        <Row label="MembershipProvider.isPremium" value={String(isPremium)} ok={isPremium} />
        <Row label="MembershipProvider.type" value={type} />
        <Row label="MembershipProvider.status" value={membershipStatus} />
      </Section>

      <Section title="4 · Linkage check (user.id ↔ membership.user_id)">
        <Row label="user.id" value={user?.id || '(none)'} />
        <Row label="membership.user_id" value={membership?.user_id || '(none)'} />
        <Row label="match?" value={linkageOk ? 'YES ✓' : 'NO ✗'} ok={linkageOk} warn={!linkageOk} />
        <Row label="rows for user_id" value={Array.isArray(rawMemberships) ? String(rawMemberships.length) : String(rawMemberships)} warn={Array.isArray(rawMemberships) && rawMemberships.length > 1} />
        {Array.isArray(rawMemberships) && rawMemberships.length > 1 && (
          <div className="mt-1 text-[10px] text-destructive font-mono">
            ⚠ {rawMemberships.length} membership rows — ensureMembership uses [0]:
            {rawMemberships.map((r, i) => (
              <div key={r.id || i} className="text-destructive/80">
                [{i}] id={r.id?.slice(-6)} type={r.type} status={r.status} user_id={r.user_id?.slice(-6)}
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="5 · Backend premium verdict (live getMatchExplanation)">
        <Row label="server premium" value={serverChecking ? '…checking' : String(serverPremium)} ok={serverPremium === true} warn={serverPremium === 'ERROR'} />
      </Section>

      <Section title="6 · Profile access layer (resolveMemberProfile)">
        <Row label="route id" value={routeId || '(none)'} />
        <Row label="tier" value={profileTier} />
        <Row label="premium" value={String(profilePremium)} ok={profilePremium === true} />
        <Row label="connected" value={String(profileConnected)} />
        <Row label="blocked" value={String(profileRes?.blocked)} warn={profileRes?.blocked} />
      </Section>

      <Section title="7 · Consistency verdict">
        <Row label="client vs server" value={clientVsServer === null ? 'MATCH ✓' : `MISMATCH (client=${isPremium} server=${serverPremium})`} ok={clientVsServer === null} warn={clientVsServer !== null} />
        <Row label="linkage" value={linkageOk ? 'OK ✓' : 'BROKEN ✗'} ok={linkageOk} warn={!linkageOk} />
        <Row
          label="full tier w/o connection → premium?"
          value={tierImpliesPremium ? (profilePremium ? 'YES ✓' : 'NO ✗ (BUG)') : 'n/a'}
          ok={tierImpliesPremium ? profilePremium : null}
          warn={tierImpliesPremium && !profilePremium}
        />
      </Section>

      <p className="text-[10px] text-muted-foreground pt-1">
        Remove <code className="font-mono">PremiumDevPanel</code> &amp; the mount in ConnectedProfile once the bug is fixed.
      </p>
    </div>
  );
}