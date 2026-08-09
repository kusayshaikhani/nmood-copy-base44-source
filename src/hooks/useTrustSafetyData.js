import { useEffect, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * FM-005 — Loads reports (SafetyReport), appeals (SupportTicket type=appeal),
 * and members (for suspension/ban counts and member resolution) through the
 * admin-verified adminConsole backend.
 */
const extract = (r) => {
  const d = r?.data;
  if (Array.isArray(d)) return d;
  if (d && Array.isArray(d.data)) return d.data;
  return [];
};

export function useTrustSafetyData() {
  const [reports, setReports] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [rep, tick, mem] = await Promise.all([
        base44.functions.invoke('adminConsole', { mode: 'list', entity: 'SafetyReport' }),
        base44.functions.invoke('adminConsole', { mode: 'list', entity: 'SupportTicket' }),
        base44.functions.invoke('adminConsole', { mode: 'list', entity: 'Member' }),
      ]);
      setReports(extract(rep));
      setTickets(extract(tick));
      setMembers(extract(mem));
    } catch (e) {
      setError(e);
      setReports([]);
      setTickets([]);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const appeals = tickets.filter((t) => t.type === 'appeal');
  const memberByUserId = {};
  const memberById = {};
  members.forEach((m) => {
    if (m.created_by_id) memberByUserId[m.created_by_id] = m;
    if (m.id) memberById[m.id] = m;
  });

  return { reports, appeals, members, memberByUserId, memberById, loading, error, refresh };
}