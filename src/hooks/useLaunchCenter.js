import { useEffect, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

/** RRPH-002 — Loads the Release Certification & Launch Center overview + live metrics. */
export function useLaunchCenter() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await base44.functions.invoke('launchCenter', { mode: 'all' });
      setData(res?.data || null);
    } catch (e) { setError(e); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  return { data, loading, error, refresh };
}