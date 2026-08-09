import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMembershipAccess } from '@/components/membership/MembershipProvider';

/**
 * RC-002A/BUG-007 — Server-authorized premium check.
 *
 * Returns the same `canSee` result used by WhyRecommendedSheet and
 * MemberActionsSheet so that premium-gated UI is hidden consistently and the
 * authorization decision is enforced server-side (authorizationGate backend),
 * not just by the client-side isPremium flag.
 *
 * @param {string} action  - authorizationGate action, e.g. 'getMatchExplanation'
 * @param {boolean} active - when false the check is skipped (default true)
 */
export function useServerPremium(action = 'getMatchExplanation', active = true) {
  const { isPremium } = useMembershipAccess();
  const [canSee, setCanSee] = useState(isPremium);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    setChecking(true);
    base44.functions
      .invoke('authorizationGate', { action })
      .then((res) => {
        if (cancelled) return;
        const premium = res?.data?.premium ?? res?.premium ?? false;
        setCanSee(premium);
      })
      // On backend failure, fall back to the client premium flag (the same
      // source the subscription screen uses) instead of locking a premium
      // user out — avoids the contradictory "Premium ACTIVE" + locked state.
      .catch(() => { if (!cancelled) setCanSee(isPremium); })
      .finally(() => { if (!cancelled) setChecking(false); });
    return () => { cancelled = true; };
  }, [action, active]);

  return { canSee, checking };
}