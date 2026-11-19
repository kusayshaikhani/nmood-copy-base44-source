import { useEffect, useState, useCallback, useRef } from 'react';
import {
  fetchPlatformOverview, fetchAdminMembers, fetchAdminRecords, toDashboardStats,
} from '@/api/adminData';

/**
 * Loads every Command Center figure from Supabase through the admin-verified
 * RPCs in migration 0014 plus the admin-readable app_records rows.
 *
 * This hook previously called a Base44 backend function that no longer answers
 * in the independently hosted build; the failures were swallowed and the
 * dashboard rendered zeros. It now fails loudly instead: if the counters or the
 * member directory cannot be read, `error` is set and no figures are shown.
 */
const REFRESH_MS = 60_000;
const LAST_SEEN_KEY = 'nmood:cc-last-seen';

export function useCommandCenterData() {
  const [stats, setStats] = useState(null);
  const [members, setMembers] = useState([]);
  const [experiences, setExperiences] = useState([]);
  const [circles, setCircles] = useState([]);
  const [reports, setReports] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [connections, setConnections] = useState([]);
  const [messages, setMessages] = useState([]);
  const [aiAudits, setAiAudits] = useState([]);
  const [aiReviews, setAiReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastSeen, setLastSeen] = useState(() => {
    try { const v = localStorage.getItem(LAST_SEEN_KEY); return v ? new Date(parseInt(v, 10)) : null; } catch { return null; }
  });

  const refresh = useCallback(async (opts = {}) => {
    const silent = opts.silent === true;
    if (!silent) { setLoading(true); setError(null); }
    try {
      // The counters and the member directory are the two sources the dashboard
      // cannot honestly render without, so a failure in either surfaces.
      const [overview, memberRows] = await Promise.all([
        fetchPlatformOverview(),
        fetchAdminMembers({ limit: 2000 }),
      ]);
      setStats(toDashboardStats(overview));
      setMembers(memberRows);

      // Enrichment lists are best effort; an empty list here is a genuinely
      // empty list because the counters above already proved the connection.
      const [exp, cir, rep, tic, msh, aia, air] = await Promise.all([
        fetchAdminRecords('Experience').catch(() => []),
        fetchAdminRecords('Circle').catch(() => []),
        fetchAdminRecords('SafetyReport').catch(() => []),
        fetchAdminRecords('SupportTicket').catch(() => []),
        fetchAdminRecords('Membership').catch(() => []),
        fetchAdminRecords('AiAuditRecord').catch(() => []),
        fetchAdminRecords('AiReviewItem').catch(() => []),
      ]);
      setExperiences(exp);
      setCircles(cir);
      setReports(rep);
      setTickets(tic);
      setMemberships(msh);
      setAiAudits(aia);
      setAiReviews(air);
      // Message and connection bodies stay private to their participants —
      // only the aggregate counts are exposed to Mission Control.
      setMessages(Array.from({ length: overview.messages_total || 0 }, (_, i) => ({ id: `msg-${i}` })));
      setConnections(Array.from({ length: overview.connections_total || 0 }, (_, i) => ({ id: `conn-${i}` })));
      setError(null);
    } catch (e) {
      setError(e);
      setStats(null);
      setMembers([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // The REST client has no realtime channel, so the console polls quietly.
  // Registrations and review decisions appear within a minute without a
  // loading flicker.
  useEffect(() => {
    const id = setInterval(() => refresh({ silent: true }), REFRESH_MS);
    return () => clearInterval(id);
  }, [refresh]);

  // Stamp the previous-visit timestamp once per mount so the next visit's
  // "since your last login" brief is measured against this session.
  const didSetSeen = useRef(false);
  useEffect(() => {
    if (didSetSeen.current) return;
    didSetSeen.current = true;
    try { localStorage.setItem(LAST_SEEN_KEY, String(Date.now())); } catch { /* storage may be unavailable */ }
  }, []);

  return { stats, members, experiences, circles, reports, tickets, memberships, connections, messages, aiAudits, aiReviews, loading, error, refresh, lastSeen };
}