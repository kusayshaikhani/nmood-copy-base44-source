import { useEffect, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

/** AI-003 — Loads the AI Operations, Governance & Assistant Platform overview. */
export function useAiOps() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('aiOps', { mode: 'overview' });
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