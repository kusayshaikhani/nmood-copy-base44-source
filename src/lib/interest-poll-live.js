import { useEffect, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

// RC-005A/CRITICAL-4 — Real InterestPoll queries replacing mockActivePolls.
// Filters by created_by_id and status='active' for the host dashboard.

export function useActivePolls() {
  const { user } = useAuth();
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.id) {
      setPolls([]);
      setLoading(false);
      return;
    }
    try {
      const records = await base44.entities.InterestPoll.filter(
        { created_by_id: String(user.id), status: 'active' },
        '-created_date',
        50
      );
      setPolls(records || []);
    } catch {
      setPolls([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!user?.id) return;
    try {
      const unsub = base44.entities.InterestPoll.subscribe(() => load());
      return unsub;
    } catch {}
  }, [user?.id, load]);

  return { polls, loading, refresh: load };
}

// Helpers preserved from interest-poll-data.js (pure functions, no mock data)
export const timePreferenceLabels = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
  weekend: 'Weekend',
};

export const getPendingCount = (poll) => {
  if (!poll) return 0;
  const total = (poll.recipient_names || []).length;
  return total - (poll.interested_count || 0) - (poll.maybe_count || 0) - (poll.declined_count || 0);
};

export const hasEnoughInterest = (poll) => {
  return (poll?.interested_count || 0) >= 2;
};