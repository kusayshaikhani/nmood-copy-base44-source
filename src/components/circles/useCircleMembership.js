import { useEffect, useState, useCallback, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { emitActivityChange } from '@/lib/activity-store';
import { trackProductEvent, PRODUCT_EVENTS } from '@/lib/product-analytics';
import { isRecordOwner, sameUserId } from '@/lib/content-ownership';
import { getCircleMembershipState, joinCircle, respondCircleMembership, removeCircleMembership, setCircleAdministrator } from '@/lib/circle-membership';
import { leaveCircle } from '@/lib/group-membership-actions';

export function resolveCircleRole({ circle, userId, memberships = [], isOrganizer = false }) {
  const myMembership = memberships.find((membership) => sameUserId(membership.member_user_id, userId)) || null;
  const organizer = isOrganizer
    || isRecordOwner(circle, userId);

  if (organizer) return 'organizer';
  if (myMembership?.status === 'member') return 'member';
  if (myMembership?.status === 'banned') return 'banned';
  if (myMembership?.status === 'pending') return 'pending';
  return 'visitor';
}

// Determines the current user's relationship to a Circle and exposes
// role-aware membership actions (join / request / leave / approve / reject / remove / ban /
// transfer ownership). Joining/leaving emits an activity-bus event so Home, AI Picks,
// Magic Door and Recommendations refresh automatically.
export function useCircleMembership(circle) {
  const { user } = useAuth();
  const [memberships, setMemberships] = useState([]);
  const [serverIsOrganizer, setServerIsOrganizer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const sequence = useRef(0);

  const circleId = circle ? String(circle.id) : null;

  const refresh = useCallback(async () => {
    const ticket=++sequence.current;
    setError(false);
    if (!circleId || !user?.id) { setMemberships([]); setServerIsOrganizer(false); setLoading(false); return; }
    setLoading(true);
    try {
      // SEC — trusted Supabase RPC. Visitors receive only their own state;
      // active members receive the roster; organizers also receive moderation fields.
      const res = await getCircleMembershipState(circleId);
      if(ticket!==sequence.current)return;
      const list = res?.members || [];
      setMemberships(list);
      setServerIsOrganizer(Boolean(res?.isOrganizer));
      // member_count is maintained atomically by the membership RPC.
    } catch {
      if(ticket!==sequence.current)return;
      setError(true);
      setMemberships([]);
      setServerIsOrganizer(false);
    } finally {
      if(ticket===sequence.current)setLoading(false);
    }
  }, [circleId, user?.id]);

  useEffect(() => { void refresh(); window.addEventListener('nmood:feed-changed',refresh); window.addEventListener('focus',refresh); return()=>{sequence.current++;window.removeEventListener('nmood:feed-changed',refresh);window.removeEventListener('focus',refresh);}; }, [refresh]);

  const userId = user?.id;
  const role = resolveCircleRole({ circle, userId, memberships, isOrganizer: serverIsOrganizer });
  const isOrganizer = role === 'organizer';
  const isMember = isOrganizer || role === 'member';
  const isBanned = role === 'banned';
  const isPending = role === 'pending';
  const myMembership = memberships.find((membership) => sameUserId(membership.member_user_id, userId)) || null;

  const members = memberships.filter((m) => m.status === 'member');
  const pending = memberships.filter((m) => m.status === 'pending');
  const banned = memberships.filter((m) => m.status === 'banned');
  const removed = memberships.filter((m) => m.status === 'removed');
  const declined = memberships.filter((m) => ['declined','rejected'].includes(m.status));

  const upsert = async () => {
    if (!user || !circleId) return null;
    if (myMembership?.status === 'member' || myMembership?.status === 'pending') {
      return { ok: true, membership: myMembership };
    }
    // SEC — server-side privacy/quota/ban/invitation check. The backend
    // determines the membership status (member vs pending) based on the
    // Circle's privacy setting — the client no longer chooses the status.
    // Member name/avatar are derived server-side from the canonical Member
    // record — the client no longer supplies identity fields.
    const res = await joinCircle(circleId);
    if (res.membership) {
      setMemberships((current) => [
        ...current.filter((membership) => !sameUserId(membership.member_user_id, userId)),
        res.membership,
      ]);
    }
    await refresh();
    return res;
  };

  const join = async () => {
    const result = await upsert();
    trackProductEvent(PRODUCT_EVENTS.CIRCLE_JOINED);
    emitActivityChange();
    return result;
  };
  const requestJoin = async () => upsert();

  const leave = async () => {
    try {
      const result = await leaveCircle(circleId);
      setMemberships((current) => current.filter((membership) => !sameUserId(membership.member_user_id, userId)));
      await refresh();
      trackProductEvent(PRODUCT_EVENTS.CIRCLE_LEFT);
      emitActivityChange();
      return result;
    } catch (err) {
      throw new Error(err?.message || 'Could not leave this circle.');
    }
  };

  // SEC — All organizer management runs through backend actions (asServiceRole)
  // because CircleMembership RLS no longer allows self-update. Each action
  // validates the caller is an organizer of the circle.
  const approve = async (membershipId) => {
    const result = await respondCircleMembership(membershipId, true); await refresh(); emitActivityChange(); return result;
  };

  const rejectRequest = async (membershipId) => {
    const result = await respondCircleMembership(membershipId, false); await refresh(); emitActivityChange(); return result;
  };

  const removeMember = async (membershipId, reason) => {
    void reason; const result = await removeCircleMembership(membershipId); await refresh(); return result;
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

  const setAdministrator = async (id, value) => { await setCircleAdministrator(id,value); await refresh(); emitActivityChange(); };

  return {
    circleRole: isOrganizer ? 'Owner' : isPending ? 'Member request pending — awaiting approval' : isMember ? (myMembership?.role === 'administrator' ? 'Circle administrator' : 'Member') : null,
    setAdministrator, role, isOrganizer, isMember, isBanned, isPending,
    members, pending, banned, removed, declined, loading, error,
    join, requestJoin, leave, approve, rejectRequest, removeMember, banMember, unban,
    transferOwnership,
    refresh,
  };
}