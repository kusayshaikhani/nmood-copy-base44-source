import { useEffect, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

/** FM-008 — Loads Experience, Circle, SafetyReport for the Community Management Center. */
const extract = (r) => {
  const d = r?.data;
  if (Array.isArray(d)) return d;
  if (d && Array.isArray(d.data)) return d.data;
  return [];
};

export function useCommunityData() {
  const [experiences, setExperiences] = useState([]);
  const [circles, setCircles] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [exp, cir, rep] = await Promise.all([
        base44.functions.invoke('adminConsole', { mode: 'list', entity: 'Experience' }),
        base44.functions.invoke('adminConsole', { mode: 'list', entity: 'Circle' }),
        base44.functions.invoke('adminConsole', { mode: 'list', entity: 'SafetyReport' }),
      ]);
      setExperiences(extract(exp));
      setCircles(extract(cir));
      setReports(extract(rep));
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  return { experiences, circles, reports, loading, error, refresh };
}