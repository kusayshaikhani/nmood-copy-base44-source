import { useEffect, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

/** RRPH-001 — Loads the Production Hardening & Operations Platform overview. */
export function useProductionHardening() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await base44.functions.invoke('productionHardening', { mode: 'overview' });
      setData(res?.data || null);
    } catch (e) { setError(e); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  return { data, loading, error, refresh };
}