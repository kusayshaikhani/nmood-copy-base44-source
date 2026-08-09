import { useEffect, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

/** FM-007 — Loads Member, Experience, Circle for live insight/knowledge sections. */
const extract = (r) => {
  const d = r?.data;
  if (Array.isArray(d)) return d;
  if (d && Array.isArray(d.data)) return d.data;
  return [];
};

export function useAiIntelligenceData() {
  const [members, setMembers] = useState([]);
  const [experiences, setExperiences] = useState([]);
  const [circles, setCircles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [mem, exp, cir] = await Promise.all([
        base44.functions.invoke('adminConsole', { mode: 'list', entity: 'Member' }),
        base44.functions.invoke('adminConsole', { mode: 'list', entity: 'Experience' }),
        base44.functions.invoke('adminConsole', { mode: 'list', entity: 'Circle' }),
      ]);
      setMembers(extract(mem));
      setExperiences(extract(exp));
      setCircles(extract(cir));
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  return { members, experiences, circles, loading, error, refresh };
}