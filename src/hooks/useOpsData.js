import { useEffect, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

/** FM-011 — Loads all Platform Operations entities in one admin-verified round trip. */
export function useOpsData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('adminConsole', { mode: 'opsCenter' });
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