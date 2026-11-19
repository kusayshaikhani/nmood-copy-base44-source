import { useEffect, useState, useCallback } from 'react';
import { fetchAdminMembers, fetchAdminRecords, fetchPhotoVerifications, fetchSafetyReports } from '@/api/adminData';

/**
 * Trust & Safety data for Mission Control, read from Supabase only.
 *
 * Reports and appeals live in admin-readable app_records; pending photo
 * verifications come from the admin-verified `admin_list_photo_verifications`
 * RPC. A connection failure sets `error` rather than rendering empty queues.
 */
export function useTrustSafetyData() {
  const [reports, setReports] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [members, setMembers] = useState([]);
  const [photoVerifications, setPhotoVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [memberRows, pending] = await Promise.all([
        fetchAdminMembers({ limit: 2000 }),
        fetchPhotoVerifications({ status: 'pending' }),
      ]);
      setMembers(memberRows);
      setPhotoVerifications(pending);
      setReports(await fetchSafetyReports());
      setTickets(await fetchAdminRecords('SupportTicket').catch(() => []));
    } catch (e) {
      setError(e);
      setReports([]);
      setTickets([]);
      setMembers([]);
      setPhotoVerifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const appeals = tickets.filter((t) => t.type === 'appeal');
  const memberByUserId = {};
  const memberById = {};
  members.forEach((m) => {
    if (m.id) { memberByUserId[m.id] = m; memberById[m.id] = m; }
  });

  return {
    reports, appeals, members, memberByUserId, memberById,
    photoVerifications, pendingPhotoCount: photoVerifications.length,
    loading, error, refresh,
  };
}
