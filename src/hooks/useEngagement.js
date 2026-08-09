import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';
import {
  computeStats,
  computeAchievements,
  computeMilestones,
  computeActivityHistory,
  computeWeeklyRecap,
} from '@/lib/engagement-engine';

export function useEngagement() {
  const { user, member } = useAuth();
  const [stats, setStats] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [history, setHistory] = useState([]);
  const [recap, setRecap] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const s = await computeStats(user, member);
      setStats(s);
      setAchievements(computeAchievements(s));
      setMilestones(computeMilestones(s));
      setHistory(await computeActivityHistory(user));
      setRecap(await computeWeeklyRecap(user, member, s));
    } catch {
      // best-effort
    } finally {
      setLoading(false);
    }
  }, [user?.id, member]);

  useEffect(() => {
    load();
  }, [load]);

  return { stats, achievements, milestones, history, recap, loading, refresh: load };
}