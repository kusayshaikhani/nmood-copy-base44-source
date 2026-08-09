import { useEffect, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * FM-003 — Loads every member and membership (admin-verified, service-role)
 * and joins them by user_id so the directory can show Explorer/Premium tier.
 *
 * Also loads live stats (total / online / premium / suspended) for the KPIs
 * and subscribes to Member + Membership realtime events so the directory and
 * KPIs refresh immediately after a registration, deletion, restoration,
 * suspension or tier change — no manual refresh required, no loading flicker.
 */
const extract = (r) => {
  const d = r?.data;
  if (Array.isArray(d)) return d;
  if (d && Array.isArray(d.data)) return d.data;
  return [];
};

export function useMembersDirectory() {
  const [members, setMembers] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async (opts = {}) => {
    const silent = opts.silent === true;
    if (!silent) setLoading(true);
    if (!silent) setError(null);
    try {
      const [memRes, membRes, stRes] = await Promise.allSettled([
        base44.functions.invoke('adminConsole', { mode: 'list', entity: 'Member', limit: 5000 }),
        base44.functions.invoke('adminConsole', { mode: 'list', entity: 'Membership', limit: 5000 }),
        base44.functions.invoke('adminConsole', { mode: 'stats' }),
      ]);
      if (memRes.status === 'fulfilled') setMembers(extract(memRes.value));
      else if (!silent) setMembers([]);
      if (membRes.status === 'fulfilled') setMemberships(extract(membRes.value));
      else if (!silent) setMemberships([]);
      if (stRes.status === 'fulfilled' && stRes.value?.data) setStats(stRes.value.data);
    } catch (e) {
      setError(e);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // Realtime — silently re-fetch whenever a Member or Membership record
  // changes so the directory and KPIs reflect registrations, deletions,
  // restorations, suspensions and tier overrides immediately. Debounced so
  // bursts coalesce; silent so there is no loading flicker.
  useEffect(() => {
    let timer;
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(() => refresh({ silent: true }), 1000);
    };
    const unsubM = base44.entities.Member.subscribe(schedule);
    const unsubMem = base44.entities.Membership.subscribe(schedule);
    return () => {
      if (typeof unsubM === 'function') unsubM();
      if (typeof unsubMem === 'function') unsubMem();
      clearTimeout(timer);
    };
  }, [refresh]);

  const membershipMap = {};
  for (const m of memberships) {
    if (m.user_id) membershipMap[m.user_id] = m;
  }

  return { members, memberships, membershipMap, stats, loading, error, refresh };
}