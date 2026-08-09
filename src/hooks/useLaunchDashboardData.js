import { useEffect, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * LM-001 — Founder Launch Dashboard data hook.
 * Pulls all eight launch metrics in one parallel batch:
 *   • productAnalytics  → DAU, MAU, retention, premium conversions
 *   • monitoringOps      → crash rate, platform health status, avg latency
 *   • adminConsole       → live active experience + circle counts
 *
 * Privacy-by-design: productAnalytics returns aggregates only (no PII).
 */
export function useLaunchDashboardData() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [observability, setObservability] = useState(null);
  const [community, setCommunity] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.allSettled([
        base44.functions.invoke('productAnalytics', {}),
        base44.functions.invoke('monitoringOps', { mode: 'dashboard' }),
        base44.functions.invoke('adminConsole', { mode: 'stats' }),
      ]);
      const [a, o, c] = results;
      if (a.status === 'fulfilled') setAnalytics(a.value || null); else setAnalytics(null);
      if (o.status === 'fulfilled') setObservability(o.value || null); else setObservability(null);
      if (c.status === 'fulfilled') setCommunity(c.value?.data || c.value || null); else setCommunity(null);
      if (a.status === 'rejected' && o.status === 'rejected') throw a.reason;
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  return { analytics, observability, community, loading, error, refresh };
}