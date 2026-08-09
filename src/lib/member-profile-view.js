import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useMembershipAccess } from '@/components/membership/MembershipProvider';

/**
 * Member-profile visibility gate.
 *
 * Another member's COMPLETE profile is returned ONLY by the server
 * (authorizationGate.resolveMemberProfile), which re-verifies the viewer's
 * active paid subscription on every call. The client never decides to unlock
 * a profile — it only renders the fields the server returned (full set for a
 * subscriber, limited preview for everyone else).
 *
 * Cache safety: query keys include the viewer's user id and their current
 * premium flag, so a profile resolved under one account is never served to
 * another. Logout hard-reloads the app (fresh query client) on top, and the
 * membership sync reconciles the flag immediately after a payment / expiry.
 */

// Imperative resolver for one-off spots (no client cache; re-resolves every
// call so the server re-verifies the viewer's subscription live).
export async function resolveMemberProfile({ userId } = {}) {
  if (!userId) return null;
  try {
    const res = await base44.functions.invoke('authorizationGate', {
      action: 'resolveMemberProfile',
      user_id: String(userId),
    });
    return res?.data || null;
  } catch {
    return null;
  }
}

// Reactive hook (cached per viewer + subscription). Used by the connected
// profile page. When the viewer's premium flag flips (payment / expiry), the
// query key changes and the profile is refetched from the server immediately.
export function useMemberProfile({ userId } = {}) {
  const { user } = useAuth();
  const { isPremium } = useMembershipAccess();
  const enabled = !!user?.id && !!userId;
  return useQuery({
    queryKey: ['memberProfile', user?.id || 'anon', isPremium ? 'p' : 'f', String(userId || '')],
    queryFn: () => resolveMemberProfile({ userId }),
    enabled,
    staleTime: 30_000,
  });
}