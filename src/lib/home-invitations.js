import { useEffect, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
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
      const [circleInvs, palReqs] = await Promise.all([
        base44.entities.CircleInvitation.filter(
          { pal_user_id: uid, status: 'pending' }
        ).catch(() => []),
        base44.entities.PalRequest.filter(
          { receiver_user_id: uid, status: 'pending' }
        ).catch(() => []),
      ]);
      setCount((circleInvs?.length || 0) + (palReqs?.length || 0));
    } catch {
      setCount(0);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!user?.id) return;
    const unsubs = [];
    try { unsubs.push(base44.entities.CircleInvitation.subscribe(() => load())); } catch {}
    try { unsubs.push(base44.entities.PalRequest.subscribe(() => load())); } catch {}
    return () => unsubs.forEach((u) => { try { u(); } catch {} });
  }, [user?.id, load]);

  return { count, loading, refresh: load };
}