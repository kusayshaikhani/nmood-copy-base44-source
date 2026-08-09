import { useEffect, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { emitActivityChange } from '@/lib/activity-store';
import { trackProductEvent, PRODUCT_EVENTS } from '@/lib/product-analytics';

// Determines the current user's relationship to a Circle and exposes
// role-aware membership actions (join / request / leave / approve / reject / remove / ban /
// transfer ownership). Joining/leaving emits an activity-bus event so Home, AI Picks,
// Magic Door and Recommendations refresh automatically.
export function useCircleMembership(circle) {
  const { user } = useAuth();
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);

  const circleId = circle ? String(circle.id) : null;
  const creatorId = circle ? circle.created_by_id : null;

  const refresh = useCallback(async () => {
    if (!circleId) { setMemberships([]); setLoading(false); return; }
    setLoading(true);
    try {
      // SEC — trusted backend read. Verifies active membership and returns
      // role-appropriate fields (organizers see pending/banned + ban_reason;
      // ordinary members see only active members without private fields).
      const resp = await base44.functions.invoke('circleMembers', { action: 'listCircleMembers', circleId });
      const res = resp?.data || resp;
      const list = res?.members || [];
      setMemberships(list);
      // SEC — member_count is maintained server-side by listCircleMembers
      // (calculated from authoritative memberships). The client no longer
      // writes Circle.member_count directly.
    } catch {
      setMemberships([]);
    } finally {
      setLoading(false);
    }
  }, [circleId]);

  useEffect(() => { refresh(); }, [refresh]);

  const userId = user?.id;
  // SEC SB1D — identify the caller's membership via the canonical member_user_id
  // (set server-side), NOT created_by_id (which is the service role).
  const myMembership = memberships.find((m) => m.member_user_id === userId) || null;
  // Organizer = whoever holds the organizer-role membership. Falls back to the
  // Circle creator while memberships are still loading (enables transfer of ownership).
  const organizerMembership = memberships.find((m) => m.role === 'organizer' && m.status === 'member') || null;
  const isOrganizer =
    (!!organizerMembership && organizerMembership.member_user_id === userId) ||
    (!organizerMembership && !!creatorId && creatorId === userId);
  const isMember = isOrganizer || (!!myMembership && myMembership.status === 'member');
  const isBanned = !!myMembership && myMembership.status === 'banned';
  const isPending = !!myMembership && myMembership.status === 'pending';

  let role = 'visitor';
  if (isOrganizer) role = 'organizer';
  else if (isMember) role = 'member';
  else if (isBanned) role = 'banned';
  else if (isPending) role = 'pending';

  const members = memberships.filter((m) => m.status === 'member');
  const pending = memberships.filter((m) => m.status === 'pending');
  const banned = memberships.filter((m) => m.status === 'banned');
  const removed = memberships.filter((m) => m.status === 'removed');

  const postSystem = async (content) => {
    try {
      await base44.functions.invoke('authorizationGate', {
        action: 'sendCircleSystemMessage',
        circleId,
        content,
      });
    } catch { /* ignore */ }
  };

  const upsert = async () => {
    if (!user || !circleId) return null;
    if (myMembership) return null; // already a member or pending
    // SEC — server-side privacy/quota/ban/invitation check. The backend
    // determines the membership status (member vs pending) based on the
    // Circle's privacy setting — the client no longer chooses the status.
    // Member name/avatar are derived server-side from the canonical Member
    // record — the client no longer supplies identity fields.
    const res = await base44.functions.invoke('authorizationGate', {
      action: 'joinCircle',
      circleId,
    });
    if (!res?.data?.ok) throw new Error(res?.data?.message || 'Could not join this circle.');
    await refresh();
    return res.data;
  };

  const join = async () => {
    const result = await upsert();
    if (result?.membership?.status === 'member') {
      await postSystem(`${user?.full_name || 'Someone'} joined the circle 🎉`);
    }
    trackProductEvent(PRODUCT_EVENTS.CIRCLE_JOINED);
    emitActivityChange();
  };
  const requestJoin = async () => { await upsert(); };

  const leave = async () => {
    if (!myMembership) return;
    // SEC — server-side final-owner protection. The backend leaveCircle
    // action enforces that the last organizer cannot leave.
    try {
      await base44.functions.invoke('authorizationGate', {
        action: 'leaveCircle',
        circleId,
      });
      await refresh();
      trackProductEvent(PRODUCT_EVENTS.CIRCLE_LEFT);
      emitActivityChange();
    } catch (err) {
      throw new Error(err?.response?.data?.message || 'Could not leave this circle.');
    }
  };

  // SEC — All organizer management runs through backend actions (asServiceRole)
  // because CircleMembership RLS no longer allows self-update. Each action
  // validates the caller is an organizer of the circle.
  const approve = async (membershipId) => {
    try { await base44.functions.invoke('authorizationGate', { action: 'approveCircleMember', membershipId }); await refresh(); }
    catch { /* ignore */ }
  };

  const rejectRequest = async (membershipId) => {
    try { await base44.functions.invoke('authorizationGate', { action: 'removeCircleMember', membershipId }); await refresh(); }
    catch { /* ignore */ }
  };

  const removeMember = async (membershipId, reason) => {
    try { await base44.functions.invoke('authorizationGate', { action: 'removeCircleMember', membershipId, reason }); await refresh(); }
    catch { /* ignore */ }
  };

  const banMember = async (membershipId, reason) => {
    try { await base44.functions.invoke('authorizationGate', { action: 'banCircleMember', membershipId, reason }); await refresh(); }
    catch { /* ignore */ }
  };

  const unban = async (membershipId) => {
    try { await base44.functions.invoke('authorizationGate', { action: 'unbanCircleMember', membershipId }); await refresh(); }
    catch { /* ignore */ }

  };

  // Transfer ownership to an existing member: backend swaps organizer roles.
  const transferOwnership = async (targetMembership) => {
    if (!targetMembership || !circleId) return;
    try {
      await base44.functions.invoke('authorizationGate', {
        action: 'transferCircleOwnership',
        circleId,
        targetMembershipId: targetMembership.id,
      });
      await refresh();
    } catch { /* ignore */ }
  };

  return {
    role, isOrganizer, isMember, isBanned, isPending,
    members, pending, banned, removed, loading,
    join, requestJoin, leave, approve, rejectRequest, removeMember, banMember, unban,
    transferOwnership,
    refresh,
  };
}