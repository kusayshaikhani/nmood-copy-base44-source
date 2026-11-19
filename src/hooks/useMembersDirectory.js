import {missionControls} from '@/api/missionControl';
import { useEffect, useState, useCallback } from 'react';
import { fetchAdminMembers, fetchAdminRecords, fetchPlatformOverview, toDashboardStats } from '@/api/adminData';

/**
 * Real Supabase member directory for Mission Control.
 *
 * Members come from the admin-verified `admin_list_members` RPC (migration
 * 0014) and membership overrides from admin-readable app_records. If Supabase
 * cannot be reached the hook reports the error instead of showing an empty
 * directory, so an outage is never mistaken for "no members".
 */
const REFRESH_MS = 60_000;

export function useMembersDirectory() {
  const [members, setMembers] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async (opts = {}) => {
    const silent = opts.silent === true;
    if (!silent) { setLoading(true); setError(null); }
    try {
      const [memberRows, overview, controls] = await Promise.all([
        fetchAdminMembers({ limit: 2000 }),
        fetchPlatformOverview(),
        missionControls(),
      ]);
      setMembers(memberRows.map(m=>{const c=controls.find(x=>x.member_id===m.id);if(!c)return m;const status=c.soft_deleted?'deleted':c.banned?'banned':c.suspended?'suspended':m.admin_status;return {...m,admin_status:status,status,mission_controls:c};}));
      setStats(toDashboardStats(overview));
      setMemberships(await fetchAdminRecords('Membership').catch(() => []));
      setError(null);
    } catch (e) {
      setError(e);
      setMembers([]);
      setStats(null);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    const id = setInterval(() => refresh({ silent: true }), REFRESH_MS);
    return () => clearInterval(id);
  }, [refresh]);

  const membershipMap = {};
  for (const m of memberships) {
    const key = m.user_id || m.member_id || m.owner_id;
    if (key) membershipMap[key] = m;
  }

  return { members, memberships, membershipMap, stats, loading, error, refresh };
}
