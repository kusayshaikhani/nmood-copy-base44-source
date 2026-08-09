import { useEffect, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

/** AI-002 — Loads the Personal Intelligence Platform overview (architecture + metrics). */
export function usePersonalIntelligence() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('aiMemory', { mode: 'overview' });
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