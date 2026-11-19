import { useEffect, useState, useCallback } from 'react';
import { getMyInvitations, supabaseSelect } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';

// RC-005A/CRITICAL-2 — Real pending invitation count for the Home screen.
// Replaces mockIncomingInvitations with real CircleInvitation + PalRequest queries.

export function usePendingInvitationCount() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.id) {
      setCount(0);
      setLoading(false);
      return;
    }
    const uid = String(user.id);
    try {
      const [typedInvitations, palReqs] = await Promise.all([
        getMyInvitations('pending'),
        supabaseSelect('pal_requests', `select=id&receiver_id=eq.${encodeURIComponent(uid)}&status=eq.pending`),
      ]);
      setCount((typedInvitations?.length || 0) + (palReqs?.length || 0));
    } catch {
      setCount(0);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  return { count, loading, refresh: load };
}