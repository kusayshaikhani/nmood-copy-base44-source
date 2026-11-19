import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { callSupabaseRpc } from '@/api/supabaseClient';
import { withTimeout } from '@/lib/bounded-operation';

import { EXPLORER_MESSAGES } from '@/lib/membership-presentation';
export { EXPLORER_MESSAGES } from '@/lib/membership-presentation';
export const isIncomingRequest = type => ['connection_request', 'circle_join_request', 'experience_join_request', 'circle_invitation', 'experience_invitation'].includes(type);
export function parseExplorerPolicy(result) {
  const policy = result?.explorer_policy;
  const administratorAccess = result?.administrator_access === true && result?.premium === true;
  const membership = { status: result?.status, expires_at: result?.expires_at, product_id: result?.product_id, auto_renew: result?.auto_renew, billing_platform: result?.billing_platform, server_now: result?.server_now };
  if (result?.premium === true) return { ...policy, membership, administratorAccess, subscriptionPremium: result?.subscription_premium === true, premium: true, discovery_locked: false, incoming_locked: false };
  if (result?.premium !== false || !policy || typeof policy.discovery_locked !== 'boolean' || !Number.isInteger(policy.remaining)) throw new Error(EXPLORER_MESSAGES.unavailable);
  return { ...policy, membership, administratorAccess: false, subscriptionPremium: false, premium: false, incoming_locked: true };
}
export async function fetchExplorerPolicy(options = {}) {
  return parseExplorerPolicy(await withTimeout(signal => callSupabaseRpc('nmood_get_my_membership_status', {}, { ...options, signal })));
}
export async function requireDiscoveryAccess() {
  // Reading public discovery is server-authorized independently of the Explorer
  // outgoing-request allowance. Mutating request workflows retain their quota
  // at the database trigger/RPC boundary.
  return fetchExplorerPolicy();
}
export function useExplorerPolicy({ manageRefresh = false } = {}) {
  const { user } = useAuth();
  const client = useQueryClient();
  const query = useQuery({ queryKey: ['explorerPolicy', user?.id], queryFn: () => fetchExplorerPolicy({ expectedUserId: user?.id }), enabled: !!user?.id, retry: false, staleTime: Infinity, refetchOnMount: manageRefresh ? 'always' : false, refetchOnWindowFocus: false });
  useEffect(() => {
    if (!manageRefresh) return undefined;
    const refresh = () => {
      void client.invalidateQueries({ queryKey: ['explorerPolicy'] });
      void client.invalidateQueries({ queryKey: ['discovery'] });
      void client.invalidateQueries({ queryKey: ['memberProfile'] });
    };
    window.addEventListener('nmood:request-policy-changed', refresh);
    window.addEventListener('nmood:refresh', refresh);
    return () => { window.removeEventListener('nmood:request-policy-changed', refresh); window.removeEventListener('nmood:refresh', refresh); };
  }, [client, manageRefresh]);
  return query;
}
