import { publicProfileResponse } from '@/lib/public-profile-fields';
import { withTimeout } from '@/lib/bounded-operation';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { callSupabaseRpc } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { useMembershipAccess } from '@/components/membership/MembershipProvider';

/**
 * Member-profile visibility gate.
 *
 * Another member's profile is read from the Supabase public-members projection.
 * Contact fields are held in member_private and are never selected here.
 *
 * Cache safety: viewer-scoped keys prevent cross-account reuse. Terminal
 * entitlement changes revalidate the server tier without hiding loaded content.
 */

async function fetchProjection(userId) {
  const response = publicProfileResponse(await withTimeout(signal => callSupabaseRpc('nmood_get_member_profile', { p_member_id: String(userId) }, { signal })));
  if (response?.tier === 'full' && response.profile && !response.blocked) {
    try {
      const details = await withTimeout(signal => callSupabaseRpc('nmood_get_member_profile_details', { p_member_id: String(userId) }, { signal }));
      return publicProfileResponse({ ...response, profile: { ...response.profile, nationality: details?.nationality, share_nationality: details?.share_nationality, height_cm: details?.height_cm, share_height: details?.share_height, work_text: details?.work_text, share_work: details?.share_work, smoking: details?.smoking, share_smoking: details?.share_smoking, drinking: details?.drinking, share_drinking: details?.share_drinking } });
    } catch { /* Optional extension unavailable; never fall back to private data. */ }
  }
  return response;
}

// Imperative resolver for one-off spots (no client cache; re-resolves every
// call so the server re-verifies the viewer's subscription live).
export async function resolveMemberProfile({ userId } = {}) {
  if (!userId) return null;
  try {
    return await fetchProjection(userId);
  } catch {
    return null;
  }
}

// Keep the server-authorized response visible while entitlement reconciles.
export function useMemberProfile({ userId } = {}) {
  const { user } = useAuth();
  const { isPremium, entitlementState } = useMembershipAccess();
  const enabled = !!user?.id && !!userId;
  const query = useQuery({
    queryKey: ['memberProfile', user?.id || 'anon', String(userId || '')],
    queryFn: () => fetchProjection(userId),
    retry: false,
    enabled,
    refetchOnMount: 'always',
    staleTime: 30_000,
  });
  const { refetch } = query;
  useEffect(() => {
    if (enabled && !['loading', 'reconciling'].includes(entitlementState)) void refetch();
  }, [enabled, isPremium, entitlementState, refetch]);
  return query;
}
