import { useEffect, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * FM-010 — Business Intelligence Center data hook.
 * Loads every raw list the BI center needs in a single admin-verified round
 * trip (adminConsole `biData` mode). The frontend computes all metrics from
 * this payload via @/lib/bi-metrics, respecting the active filters.
 */
export function useBiData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('adminConsole', { mode: 'biData' });
      setData(res?.data || null);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { data, loading, error, refresh };
}