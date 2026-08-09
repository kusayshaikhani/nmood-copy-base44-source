import { useEffect, useState, useCallback, useRef } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * FM-006 — Loads all Command Center data in one parallel batch through the
 * admin-verified adminConsole backend (stats + entity lists) and tracks the
 * administrator's previous-visit timestamp for the executive brief.
 *
 * MC-003 — expanded to also load connections (PalConnection), messages
 * (PrivateMessage), AI audit records and AI review items so the dashboard can
 * surface live values instead of placeholders.
 */
const extract = (r) => {
  const d = r?.data;
  if (Array.isArray(d)) return d;
  if (d && Array.isArray(d.data)) return d.data;
  return [];
};

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
    if (!silent) setLoading(true);
    if (!silent) setError(null);
    try {
      const results = await Promise.allSettled([
        base44.functions.invoke('adminConsole', { mode: 'stats' }),
        base44.functions.invoke('adminConsole', { mode: 'list', entity: 'Member' }),
        base44.functions.invoke('adminConsole', { mode: 'list', entity: 'Experience' }),
        base44.functions.invoke('adminConsole', { mode: 'list', entity: 'Circle' }),
        base44.functions.invoke('adminConsole', { mode: 'list', entity: 'SafetyReport' }),
        base44.functions.invoke('adminConsole', { mode: 'list', entity: 'SupportTicket' }),
        base44.functions.invoke('adminConsole', { mode: 'list', entity: 'Membership' }),
        base44.functions.invoke('adminConsole', { mode: 'list', entity: 'PalConnection' }),
        base44.functions.invoke('adminConsole', { mode: 'list', entity: 'PrivateMessage' }),
        base44.functions.invoke('adminConsole', { mode: 'list', entity: 'AiAuditRecord' }),
        base44.functions.invoke('adminConsole', { mode: 'list', entity: 'AiReviewItem' }),
      ]);
      const [st, mem, exp, cir, rep, tic, msh, conn, msg, aia, air] = results;
      // Stats + core lists must succeed; enrichment lists are best-effort.
      if (st.status === 'fulfilled') setStats(st.value?.data || null); else throw st.reason;
      if (mem.status === 'fulfilled') setMembers(extract(mem.value)); else throw mem.reason;
      setExperiences(exp.status === 'fulfilled' ? extract(exp.value) : []);
      setCircles(cir.status === 'fulfilled' ? extract(cir.value) : []);
      setReports(rep.status === 'fulfilled' ? extract(rep.value) : []);
      setTickets(tic.status === 'fulfilled' ? extract(tic.value) : []);
      setMemberships(msh.status === 'fulfilled' ? extract(msh.value) : []);
      setConnections(conn.status === 'fulfilled' ? extract(conn.value) : []);
      setMessages(msg.status === 'fulfilled' ? extract(msg.value) : []);
      setAiAudits(aia.status === 'fulfilled' ? extract(aia.value) : []);
      setAiReviews(air.status === 'fulfilled' ? extract(air.value) : []);
    } catch (e) {
      setError(e);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // Realtime — silently re-fetch stats whenever a Member record is created,
  // updated, or deleted so the Members KPI (and derived metrics) reflect
  // registrations, deletions and restorations immediately, with no manual
  // refresh and no loading flicker. Debounced so bursts coalesce.
  useEffect(() => {
    let timer;
    const unsub = base44.entities.Member.subscribe(() => {
      clearTimeout(timer);
      timer = setTimeout(() => refresh({ silent: true }), 1200);
    });
    return () => { if (typeof unsub === 'function') unsub(); clearTimeout(timer); };
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