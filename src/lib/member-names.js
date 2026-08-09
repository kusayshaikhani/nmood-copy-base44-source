import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useMembershipAccess } from '@/components/membership/MembershipProvider';

/**
 * Member-name visibility gate.
 *
 * Another member's real first + last name is returned ONLY by the server
 * (authorizationGate.resolveMemberNames), which re-verifies the viewer's
 * active paid subscription on every call. The client never decides to
 * reveal a name — it only renders what the server returned (a real name
 * string, or null → the localized "Member" fallback).
 *
 * Cache safety (test-case 4): query keys include the viewer's user id and
 * their current premium flag, so a name resolved under one account is never
 * served to another. Logout hard-reloads the app (fresh query client) on top.
 */

// Imperative resolver for data-layer hooks (no client cache; re-resolves
// every call so the server re-verifies the viewer's subscription).
export async function resolveMemberNames({ memberIds = [], userIds = [] } = {}) {
  const member_ids = [...new Set((memberIds || []).map(String).filter(Boolean))];
  const user_ids = [...new Set((userIds || []).map(String).filter(Boolean))];
  if (!member_ids.length && !user_ids.length) return {};
  try {
    const res = await base44.functions.invoke('authorizationGate', {
      action: 'resolveMemberNames',
      member_ids,
      user_ids,
    });
    return (res && res.data && res.data.names) || {};
  } catch {
    return {};
  }
}

// Reactive batch hook (cached per viewer + subscription; use in list pages).
export function useMemberNames({ memberIds = [], userIds = [] } = {}) {
  const { user } = useAuth();
  const { isPremium } = useMembershipAccess();
  const mKey = [...memberIds].sort().join(',');
  const uKey = [...userIds].sort().join(',');
  const enabled = !!user?.id && (memberIds.length > 0 || userIds.length > 0);
  return useQuery({
    queryKey: ['memberNames', user?.id || 'anon', isPremium ? 'p' : 'f', mKey, uKey],
    queryFn: () => resolveMemberNames({ memberIds, userIds }),
    enabled,
    staleTime: 60_000,
  });
}

// Single-name hook (one-off spots like a chat / profile header).
export function useMemberName({ memberId, userId } = {}) {
  const { user } = useAuth();
  const { isPremium } = useMembershipAccess();
  const key = memberId ? { t: 'm', id: String(memberId) } : userId ? { t: 'u', id: String(userId) } : null;
  const enabled = !!user?.id && !!key;
  return useQuery({
    queryKey: ['memberName', user?.id || 'anon', isPremium ? 'p' : 'f', key?.t, key?.id],
    queryFn: async () => {
      const names = await resolveMemberNames({
        memberIds: key?.t === 'm' ? [key.id] : [],
        userIds: key?.t === 'u' ? [key.id] : [],
      });
      return key ? (names[key.id] ?? null) : null;
    },
    enabled,
    staleTime: 60_000,
  });
}