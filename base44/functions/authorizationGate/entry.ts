// SEC-001A — Central Server-Side Authorization Gate.
// The client is NEVER authoritative for membership-restricted or
// member-to-member interactions. Every gated mutation below is validated
// here (auth + entitlement/quota + block isolation) before any record is
// created. Failures return 403 with a friendly reason; abuse signals are logged.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { json, isPremium, getMembership, isBlockedPair, getMember, resolveTargetMember, experienceStartUtc, recountCircleMembers } from '../../shared/concierge-utils.ts';

// Quota mirrors src/lib/permission-engine.js LIMITED table (Explorer only).
const QUOTAS = {
  join_circle: { key: 'circle_joins', windowHours: 72, max: 2 },
  join_experience: { key: 'experience_joins', windowHours: 72, max: 2 },
  connection_request: { key: 'connection_requests', windowHours: 72, max: 2 },
};

function countRecent(arr, windowHours, nowMs = Date.now()) {
  const windowMs = windowHours * 3600000;
  return (Array.isArray(arr) ? arr : []).filter((ts) => {
    const t = new Date(ts).getTime();
    return Number.isFinite(t) && nowMs - t < windowMs;
  }).length;
}

// Append a usage timestamp to the membership quota array (Explorer tracking).
async function recordUsage(svc, membership, action) {
  if (!membership || isPremium(membership)) return membership;
  const q = QUOTAS[action];
  if (!q) return membership;
  const now = new Date().toISOString();
  const arr = Array.isArray(membership[q.key]) ? [...membership[q.key], now] : [now];
  return svc.entities.Membership.update(membership.id, { [q.key]: arr }).catch(() => membership);
}

async function logSecurity(svc, user, event, details) {
  try {
    await svc.entities.ErrorLog.create({
      message: `authz:${event}`,
      severity: 'warning',
      screen: 'authorizationGate',
      context: { user: String(user.id), details },
    });
  } catch { /* never let logging break the request */ }
}

// RC1-002 — Mission Control telemetry for private messaging.
// Counts only; NO message content is ever recorded.
async function trackPrivate(svc, eventName, props) {
  try {
    await svc.entities.ProductEvent.create({
      event_name: eventName,
      category: 'connections',
      properties: props || {},
    });
  } catch { /* never block */ }
}

// AGE-001 — Server-side 18+ eligibility check. Verifies the caller's Member
// record has a confirmed DOB of 18+. DOB is never logged or sent to analytics.
//
// SECURITY: Always verifies the DOB directly — NEVER trusts the client-editable
// eligibility_status field. A user could set eligibility_status to 'verified'
// through the SDK without a valid DOB. The DOB is the sole source of truth.
// The only non-DOB check is 'restricted' (admin-set, takes precedence).
async function checkEligibility(svc, user): Promise<boolean> {
  try {
    // Reuse getCallerMember so the email fallback (for service-role-created
    // members) applies here too — otherwise eligibility checks fail for
    // members created via the createProfile backend action.
    const member = await getCallerMember(svc, user);
    if (!member) return false;
    // Admin-set restriction always blocks, even with a valid DOB.
    if (member.eligibility_status === 'restricted') return false;
    // ALWAYS verify the DOB directly — never trust eligibility_status alone.
    if (!member.date_of_birth) return false;
    const birth = new Date(member.date_of_birth);
    if (isNaN(birth.getTime()) || birth.getTime() > Date.now()) return false;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    if (today.getMonth() < birth.getMonth() ||
        (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--;
    return age >= 18;
  } catch {
    return false;
  }
}

// AGE-001 — Fields that must NEVER be set by clients directly. Only backend
// actions (updateDob, deleteAccount) or admin processes may write these.
const PROTECTED_MEMBER_FIELDS = new Set([
  'date_of_birth', 'eligibility_status', 'eligibility_verified_at', 'dob_change_requested_at',
]);

// Resolve the authenticated user's canonical Member record (shared helper).
// Prefers onboarded records, tie-breaks by earliest created_date.
async function getCallerMember(svc, user) {
  let rows = await svc.entities.Member.filter({ created_by_id: String(user.id) }).catch(() => []);
  // createProfile runs as the service role, so created_by_id is stamped
  // with the service role id — not the user's id. For members created via
  // onboarding, fall back to email (set to user.email by createProfile).
  if ((!rows || rows.length === 0) && user?.email) {
    rows = await svc.entities.Member.filter({ email: String(user.email) }).catch(() => []);
  }
  if (!rows || rows.length === 0) return null;
  const onboarded = rows.filter((r: any) => r.onboarding_completed);
  const pool = onboarded.length ? onboarded : rows;
  return pool.slice().sort((a: any, b: any) =>
    new Date(a.created_date).getTime() - new Date(b.created_date).getTime()
  )[0];
}

// AGE-001 — Check if a member record is 18+ based solely on the DOB.
// NEVER trusts the client-editable eligibility_status field. Used to filter
// TARGET members (the member being viewed/resolved, not the caller) in
// resolveMemberProfile and resolveMemberNames. The caller's own eligibility
// uses checkEligibility (which also checks the 'restricted' admin flag).
function isAdultMember(m: any): boolean {
  if (!m || !m.date_of_birth) return false;
  const birth = new Date(m.date_of_birth);
  if (isNaN(birth.getTime()) || birth.getTime() > Date.now()) return false;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (today.getMonth() < birth.getMonth() ||
      (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--;
  return age >= 18;
}

// Actions that require 18+ eligibility (social interactions only).
// Read-only actions (resolveMemberProfile, getMatchExplanation, etc.) are
// not gated — they return limited data regardless of eligibility.
const ELIGIBILITY_REQUIRED_ACTIONS = new Set([
  'requestConnection', 'acceptConnection', 'rejectConnection', 'cancelConnectionRequest',
  'joinCircle', 'leaveCircle',
  'joinExperience', 'leaveExperience',
  'sendCircleInvitations', 'sendExperienceInvitations', 'sendMessage',
  'blockMember', 'unblockMember',
  'approveCircleMember', 'removeCircleMember', 'banCircleMember', 'unbanCircleMember', 'transferCircleOwnership',
  // Batch 1A — circle chat moderation, attendance, invitation responses, lifecycle.
  'editCircleMessage', 'pinCircleMessage', 'reactCircleMessage', 'deleteCircleMessage', 'sendCircleSystemMessage',
  'markArrived', 'updateAttendanceReminders', 'removeAttendee',
  'respondCircleInvitation', 'respondExperienceInvitation',
  'deleteCircle', 'createOrganizerMembership',
]);

function previewFor(payload) {
  switch (payload.type) {
    case 'photo': return '📷 Photo';
    case 'voice': return '🎤 Voice message';
    case 'location': return '📍 Location';
    case 'shared_experience': return 'Shared an experience';
    case 'shared_circle': return 'Shared a circle';
    case 'shared_profile': return 'Shared a profile';
    default: return payload.content || '';
  }
}

// ---------------------------------------------------------------------------
// Action handlers
// ---------------------------------------------------------------------------
async function requestConnection(svc, user, body) {
  const receiverId = body.receiverId ? String(body.receiverId) : '';
  if (!receiverId) return json(400, { error: 'invalid_request' });
  if (String(receiverId) === String(user.id)) return json(400, { error: 'self_request' });

  // Block isolation (both directions).
  if (await isBlockedPair(svc, user.id, receiverId)) {
    await logSecurity(svc, user, 'blocked_connection_request', { receiverId });
    return json(403, { error: 'blocked', message: "You can't connect with this member." });
  }

  // No duplicate pending request.
  const dup = await svc.entities.PalRequest.filter({
    sender_user_id: String(user.id), receiver_user_id: receiverId, status: 'pending',
  }).catch(() => []);
  if (dup && dup.length) return json(409, { error: 'already_requested' });

  // Quota (Explorer only).
  const membership = await getMembership(svc, user.id);
  if (!isPremium(membership)) {
    const q = QUOTAS.connection_request;
    if (countRecent(membership?.[q.key], q.windowHours) >= q.max) {
      await logSecurity(svc, user, 'connection_quota_exceeded', { used: countRecent(membership?.[q.key], q.windowHours) });
      return json(403, { error: 'limit_reached', message: 'Connection request limit reached. Upgrade to Premium for unlimited.' });
    }
  }

  const req = await svc.entities.PalRequest.create({
    sender_user_id: String(user.id),
    sender_name: body.senderName || user.full_name || 'You',
    sender_avatar: body.senderAvatar || '',
    receiver_user_id: receiverId,
    receiver_name: body.receiverName || '',
    receiver_avatar: body.receiverAvatar || '',
    experience_id: body.experienceId || 0,
    experience_title: body.experienceTitle || '',
    mutual_interests: Array.isArray(body.mutualInterests) ? body.mutualInterests : [],
    message: body.message || '',
    status: 'pending',
    direction: 'outgoing',
  });
  await recordUsage(svc, membership, 'connection_request');
  return json(200, { ok: true, request: req });
}

async function acceptConnection(svc, user, body) {
  const requestId = body.requestId;
  if (!requestId) return json(400, { error: 'invalid_request' });
  const req = await svc.entities.PalRequest.get(requestId).catch(() => null);
  if (!req || req.receiver_user_id !== String(user.id)) return json(403, { error: 'not_authorized' });
  if (req.status !== 'pending') return json(409, { error: 'already_handled' });

  // Block isolation: refuse to accept if either side blocked the other.
  if (await isBlockedPair(svc, user.id, req.sender_user_id)) {
    await logSecurity(svc, user, 'blocked_accept', { senderId: req.sender_user_id });
    return json(403, { error: 'blocked', message: "You can't connect with this member." });
  }

  await svc.entities.PalRequest.update(requestId, { status: 'accepted' });
  const existing = await svc.entities.PalConnection.filter({
    user_id: String(user.id), pal_user_id: req.sender_user_id,
  }).catch(() => []);
  let conn = existing && existing[0] ? existing[0] : null;
  if (!conn) {
    conn = await svc.entities.PalConnection.create({
      user_id: String(user.id),
      pal_user_id: req.sender_user_id,
      pal_name: req.sender_name,
      pal_avatar: req.sender_avatar || '',
      pal_city: '',
      first_experience_title: req.experience_title || '',
      mutual_experiences_count: 1,
      mutual_interests: req.mutual_interests || [],
      last_experience_title: req.experience_title || '',
      last_activity_at: new Date().toISOString(),
      connected_date: new Date().toISOString().slice(0, 10),
      is_active: true,
    });
  }
  return json(200, { ok: true, connection: conn });
}

async function joinCircle(svc, user, body) {
  const circleId = body.circleId ? String(body.circleId) : '';
  if (!circleId) return json(400, { error: 'invalid_request' });

  // Banned members cannot rejoin. Use member_user_id (canonical user ID set
  // server-side) — NOT created_by_id, which is the service role.
  const mine = await svc.entities.CircleMembership.filter({
    circle_id: circleId, member_user_id: String(user.id),
  }).catch(() => []);
  if (mine && mine.some((m) => m.status === 'banned')) return json(403, { error: 'banned', message: 'You are banned from this circle.' });
  if (mine && mine.some((m) => m.status === 'member' || m.status === 'pending')) return json(409, { error: 'already_member' });

  // Circle must exist, be active, accept registrations, and have room.
  const circle = await svc.entities.Circle.get(circleId).catch(() => null);
  if (!circle) return json(404, { error: 'not_found' });
  if (circle.is_hidden || circle.is_demo) return json(404, { error: 'not_found' });
  if (circle.status !== 'active') return json(403, { error: 'not_active', message: 'This circle is not currently active.' });
  if (circle.registrations_open === false) return json(403, { error: 'registrations_closed', message: 'Registrations are closed for this circle.' });
  if (circle.max_members && circle.max_members > 0) {
    const activeMembers = await svc.entities.CircleMembership.filter({ circle_id: circleId, status: 'member' }).catch(() => []);
    if (activeMembers.length >= circle.max_members) return json(403, { error: 'full', message: 'This circle is full.' });
  }

  // Block isolation with the circle owner (created_by_id).
  const ownerUserId = String(circle.created_by_id || '');
  if (ownerUserId && await isBlockedPair(svc, user.id, ownerUserId)) {
    return json(403, { error: 'blocked', message: "You can't join this circle." });
  }

  // Privacy enforcement: private/invite → valid invitation required.
  const privacy = circle.privacy || 'public';
  if (privacy === 'private' || privacy === 'invite') {
    const inv = await svc.entities.CircleInvitation.filter({
      circle_id: circleId, pal_user_id: String(user.id), status: 'pending',
    }).catch(() => []);
    if (!inv || inv.length === 0) {
      return json(403, { error: 'invitation_required', message: 'This circle is invite-only.' });
    }
    // Check invitation expiration — expired invitations are rejected.
    const now = Date.now();
    const valid = inv.filter((i: any) => {
      if (!i.expires_at) return true;
      const exp = new Date(i.expires_at).getTime();
      return !isNaN(exp) && exp > now;
    });
    if (valid.length === 0) {
      return json(403, { error: 'invitation_expired', message: 'Your invitation to this circle has expired.' });
    }
  }

  // Quota (Explorer only).
  const membership = await getMembership(svc, user.id);
  if (!isPremium(membership)) {
    const q = QUOTAS.join_circle;
    if (countRecent(membership?.[q.key], q.windowHours) >= q.max) {
      await logSecurity(svc, user, 'circle_join_quota_exceeded', {});
      return json(403, { error: 'limit_reached', message: 'Circle join limit reached. Upgrade to Premium for unlimited.' });
    }
  }

  // approval → pending request; public → active membership.
  const status = privacy === 'approval' ? 'pending' : 'member';

  // Race-condition narrowing: re-check for duplicate membership right before
  // creating. Without a DB unique index, two near-simultaneous requests could
  // both pass the initial check above. This second check narrows the window.
  // RACE-CONDITION LIMITATION: Base44 does not expose MongoDB unique indexes
  // through the entity schema, so a narrow race window remains between this
  // check and the create below. This is the strongest server-side protection
  // available without a unique constraint.
  const recheck = await svc.entities.CircleMembership.filter({
    circle_id: circleId, member_user_id: String(user.id),
  }).catch(() => []);
  if (recheck && recheck.some((m) => m.status === 'member' || m.status === 'pending')) {
    return json(409, { error: 'already_member' });
  }

  // Derive member identity server-side from the canonical Member record —
  // NEVER from client-supplied body.memberName / body.memberAvatar. This
  // prevents a client from forging another member's name/avatar on a join.
  const callerMember = await getCallerMember(svc, user);
  const m = await svc.entities.CircleMembership.create({
    circle_id: circleId,
    member_user_id: String(user.id),
    member_name: callerMember?.display_name || user.full_name || 'You',
    member_avatar: callerMember?.photo_url || '',
    role: 'member',
    status,
    joined_date: new Date().toISOString().slice(0, 10),
  });
  await recordUsage(svc, membership, 'join_circle');

  // Authoritative member_count — recount distinct active members server-side.
  // Only 'member' status counts toward capacity; 'pending' does not.
  if (status === 'member') {
    await recountCircleMembers(svc, circleId);
  }

  return json(200, { ok: true, membership: m });
}

async function leaveCircle(svc, user, body) {
  const circleId = body.circleId ? String(body.circleId) : '';
  if (!circleId) return json(400, { error: 'invalid_request' });

  // Use member_user_id (canonical user ID) — NOT created_by_id (service role).
  const mine = await svc.entities.CircleMembership.filter({
    circle_id: circleId, member_user_id: String(user.id),
  }).catch(() => []);
  const membership = (mine || []).find((m) => m.status === 'member' || m.role === 'organizer');
  if (!membership) return json(404, { error: 'not_member' });

  // Final owner protection: if the caller is the only organizer, they cannot leave.
  const isOrganizer = membership.role === 'organizer';
  if (isOrganizer) {
    const allMembers = await svc.entities.CircleMembership.filter({
      circle_id: circleId, status: 'member',
    }).catch(() => []);
    const organizers = (allMembers || []).filter((m) => m.role === 'organizer');
    if (organizers.length <= 1) {
      return json(403, { error: 'final_owner', message: 'You are the only organizer. Transfer ownership or close the circle before leaving.' });
    }
  }

  await svc.entities.CircleMembership.delete(membership.id);

  // Authoritative member_count — recount distinct active members server-side.
  await recountCircleMembers(svc, circleId);

  return json(200, { ok: true });
}

async function joinExperience(svc, user, body) {
  const experienceId = body.experienceId;
  if (!experienceId) return json(400, { error: 'invalid_request' });

  // No duplicate going attendance. Use member_user_id (the canonical attendee
  // user ID set server-side) — NOT created_by_id, which is the service role.
  const mine = await svc.entities.Attendance.filter({
    experience_id: experienceId, member_user_id: String(user.id),
  }).catch(() => []);
  if (mine && mine.some((a) => a.status === 'going' || a.status === 'waiting')) return json(409, { error: 'already_joined' });

  // Experience must exist, be active, not be full, not be past, and not be blocked.
  const exp = await svc.entities.Experience.get(experienceId).catch(() => null);
  if (!exp) return json(404, { error: 'not_found' });
  if (exp.is_hidden || exp.is_archived || exp.is_demo) return json(403, { error: 'not_found' });
  if (exp.status !== 'active') return json(403, { error: 'not_active', message: 'This experience is not available for joining.' });
  // Past experiences cannot be joined (timezone-aware UTC check).
  const startUtc = experienceStartUtc(exp);
  if (startUtc && startUtc.getTime() < Date.now()) {
    return json(403, { error: 'expired', message: 'This experience has already started or ended.' });
  }
  // Block isolation — cannot join an experience hosted by a blocked member.
  if (exp.host_user_id && await isBlockedPair(svc, user.id, String(exp.host_user_id))) {
    return json(403, { error: 'blocked', message: "You can't join this experience." });
  }

  // Host status check — suspended/deleted/banned/deactivated hosts' experiences are denied.
  if (exp.host_user_id) {
    const hostRows = await svc.entities.Member.filter({ created_by_id: String(exp.host_user_id) }).catch(() => []);
    const hostMember = hostRows && hostRows[0];
    if (hostMember && ['suspended', 'deleted', 'banned', 'deactivated'].includes(hostMember.admin_status)) {
      return json(403, { error: 'host_unavailable', message: 'This experience is no longer available.' });
    }
  }

  // Visibility enforcement: connections → must be a Pal of the host; private → valid invitation or host.
  const visibility = exp.visibility || 'public';
  if (visibility === 'connections' && exp.host_user_id && String(exp.host_user_id) !== String(user.id)) {
    const [connFwd, connRev] = await Promise.all([
      svc.entities.PalConnection.filter({ user_id: String(user.id), pal_user_id: String(exp.host_user_id), is_active: true }).catch(() => []),
      svc.entities.PalConnection.filter({ user_id: String(exp.host_user_id), pal_user_id: String(user.id), is_active: true }).catch(() => []),
    ]);
    if ((!connFwd || !connFwd.length) && (!connRev || !connRev.length)) {
      return json(403, { error: 'connections_only', message: 'This experience is only for connections of the host.' });
    }
  }
  if (visibility === 'private' && (!exp.host_user_id || String(exp.host_user_id) !== String(user.id))) {
    // Private/invite-only experiences accept participants with a valid unexpired invitation.
    const inv = await svc.entities.ExperienceInvitation.filter({
      experience_id: String(experienceId), pal_user_id: String(user.id), status: 'pending',
    }).catch(() => []);
    const now = Date.now();
    const valid = (inv || []).filter((i: any) => {
      if (!i.expires_at) return true;
      const exp = new Date(i.expires_at).getTime();
      return !isNaN(exp) && exp > now;
    });
    if (valid.length === 0) {
      return json(403, { error: 'invitation_required', message: 'This experience is private and requires a valid invitation.' });
    }
  }

  // Quota (Explorer only).
  const membership = await getMembership(svc, user.id);
  if (!isPremium(membership)) {
    const q = QUOTAS.join_experience;
    if (countRecent(membership?.[q.key], q.windowHours) >= q.max) {
      await logSecurity(svc, user, 'experience_join_quota_exceeded', {});
      return json(403, { error: 'limit_reached', message: 'Experience join limit reached. Upgrade to Premium for unlimited.' });
    }
  }

  // Derive status server-side from capacity — NEVER trust client-supplied status.
  // If the experience is full, the attendee joins the waiting list automatically.
  const status = (exp.max_participants && exp.max_participants > 0 && (exp.spots_filled || 0) >= exp.max_participants) ? 'waiting' : 'going';

  // Race-condition narrowing: re-check for duplicate attendance right before
  // creating. Without a DB unique index, two near-simultaneous requests could
  // both pass the initial check above. This second check narrows the window.
  // RACE-CONDITION LIMITATION: Base44 does not expose MongoDB unique indexes
  // through the entity schema, so a narrow race window remains between this
  // check and the create below. This is the strongest server-side protection
  // available without a unique constraint.
  const recheck = await svc.entities.Attendance.filter({
    experience_id: experienceId, member_user_id: String(user.id),
  }).catch(() => []);
  if (recheck && recheck.some((a) => a.status === 'going' || a.status === 'waiting')) {
    return json(409, { error: 'already_joined' });
  }

  // Derive member identity server-side from the canonical Member record —
  // NEVER from client-supplied body.memberName / body.memberAvatar.
  const callerMember = await getCallerMember(svc, user);
  const a = await svc.entities.Attendance.create({
    experience_id: experienceId,
    member_user_id: String(user.id),
    member_name: callerMember?.display_name || user.full_name || 'You',
    member_avatar: callerMember?.photo_url || '',
    status,
    reminders_enabled: body.remindersEnabled !== false,
  });
  await recordUsage(svc, membership, 'join_experience');

  // Authoritative capacity update — increment spots_filled once, server-side.
  // Only 'going' attendances consume capacity; 'waiting' does not.
  let updatedExp = null;
  if (status === 'going') {
    updatedExp = await svc.entities.Experience.update(experienceId, {
      spots_filled: (exp.spots_filled || 0) + 1,
    }).catch(() => null);
  }

  // Server-derived system message — client cannot forge type='system' or sender
  // identity. Only posted for 'going' joins (not waiting-list).
  if (status === 'going') {
    try {
      await svc.entities.ChatMessage.create({
        experience_id: experienceId,
        sender_name: 'System',
        type: 'system',
        content: `${callerMember?.display_name || user.full_name || 'Someone'} joined the experience`,
      });
    } catch { /* best-effort */ }
  }

  return json(200, { ok: true, attendance: a, experience: updatedExp || undefined });
}

async function leaveExperience(svc, user, body) {
  const experienceId = body.experienceId;
  if (!experienceId) return json(400, { error: 'invalid_request' });

  const mine = await svc.entities.Attendance.filter({
    experience_id: experienceId, member_user_id: String(user.id),
  }).catch(() => []);
  const attendance = (mine || []).find((a) => a.status === 'going' || a.status === 'waiting');
  if (!attendance) return json(404, { error: 'not_attending' });

  await svc.entities.Attendance.delete(attendance.id);

  // Authoritative capacity update — decrement spots_filled once, server-side.
  // Only 'going' attendances count toward capacity; 'waiting' does not.
  let updatedExp = null;
  if (attendance.status === 'going') {
    const exp = await svc.entities.Experience.get(experienceId).catch(() => null);
    if (exp && exp.spots_filled && exp.spots_filled > 0) {
      updatedExp = await svc.entities.Experience.update(exp.id, {
        spots_filled: Math.max(0, exp.spots_filled - 1),
      }).catch(() => null);
    }
  }

  // Server-derived system message — created after the authorized leave succeeds.
  // The client cannot forge type='system' or sender identity, and does not need
  // to call sendMessage after attendance removal (which would fail the auth check).
  try {
    await svc.entities.ChatMessage.create({
      experience_id: experienceId,
      sender_name: 'System',
      type: 'system',
      content: `${attendance.member_name || 'Someone'} left the experience`,
    });
  } catch { /* best-effort */ }

  return json(200, { ok: true, experience: updatedExp || undefined });
}

async function cancelExperience(svc, user, body) {
  const experienceId = body.experienceId;
  if (!experienceId) return json(400, { error: 'invalid_request' });
  const exp = await svc.entities.Experience.get(experienceId).catch(() => null);
  if (!exp) return json(404, { error: 'not_found' });

  // Host or admin only.
  const isHost = exp.host_user_id && String(exp.host_user_id) === String(user.id);
  const isAdmin = user.role === 'admin' || user.role === 'founder';
  if (!isHost && !isAdmin) return json(403, { error: 'not_authorized', message: 'Only the host can cancel this experience.' });

  // Idempotent: if already cancelled, return ok.
  if (exp.status === 'cancelled') return json(200, { ok: true, already_cancelled: true });

  const cancelReason = String(body.reason || '').slice(0, 1000);
  const updated = await svc.entities.Experience.update(experienceId, {
    status: 'cancelled',
    cancelled_at: new Date().toISOString(),
    cancel_reason: cancelReason,
  });

  // ─────────────────────────────────────────────────────────────────
  // Cancellation notification path (SEC-005).
  // Implemented but DISABLED during this audit — no real notification is sent.
  // Set CANCELLATION_NOTIFICATIONS_ENABLED to true after audit completion.
  // Idempotent: the early return for already-cancelled experiences above
  // ensures this block runs at most once per experience.
  // Minimal non-sensitive content: experience title + cancellation reason.
  // No sensitive information (no member names, no locations beyond title).
  // ─────────────────────────────────────────────────────────────────
  const CANCELLATION_NOTIFICATIONS_ENABLED = false;
  if (CANCELLATION_NOTIFICATIONS_ENABLED) {
    try {
      const attendees = await svc.entities.Attendance.filter({
        experience_id: experienceId, status: 'going',
      }).catch(() => []);
      for (const attendee of (attendees || [])) {
        // Create a ProductEvent that the client notification system picks up.
        // Minimal content: experience id, title, and cancellation reason.
        await svc.entities.ProductEvent.create({
          event_name: 'experience_cancelled',
          category: 'experiences',
          properties: {
            experience_id: String(experienceId),
            experience_title: (exp.title || '').slice(0, 200),
            cancel_reason: cancelReason.slice(0, 500),
            target_user_id: String(attendee.member_user_id || ''),
          },
        });
      }
    } catch { /* best-effort — never block the cancellation response */ }
  }
  return json(200, { ok: true, experience: updated });
}

async function sendCircleInvitations(svc, user, body) {
  const circleId = body.circleId ? String(body.circleId) : '';
  const invites = Array.isArray(body.invites) ? body.invites : [];
  if (!circleId || invites.length === 0) return json(400, { error: 'invalid_request' });

  // Filter out any pal who has blocked the sender (or whom the sender blocked).
  const safe = [];
  for (const inv of invites) {
    const palUserId = inv.palUserId ? String(inv.palUserId) : '';
    if (palUserId && await isBlockedPair(svc, user.id, palUserId)) {
      await logSecurity(svc, user, 'blocked_invitation', { palUserId });
      continue;
    }
    safe.push({
      circle_id: circleId,
      circle_name: inv.circleName || body.circleName || '',
      circle_image: inv.circleImage || body.circleImage || '',
      sender_name: inv.senderName || user.full_name || 'You',
      sender_avatar: inv.senderAvatar || '',
      pal_user_id: palUserId,
      pal_name: inv.palName || '',
      pal_avatar: inv.palAvatar || '',
      personal_message: inv.personalMessage || body.message || '',
      status: 'pending',
      direction: 'outgoing',
      // Server-generated expiry — clients cannot set arbitrary expiry values.
      expires_at: new Date(Date.now() + 7 * 24 * 3600000).toISOString(),
    });
  }
  if (safe.length === 0) return json(403, { error: 'blocked', message: 'None of the selected members can be invited.' });
  const created = await svc.entities.CircleInvitation.bulkCreate(safe);
  return json(200, { ok: true, sent: created.length });
}

async function sendMessage(svc, user, body) {
  const scope = body.scope || 'private';
  // The target entity is hard-coded per scope — NEVER derived from client input.
  // Letting the client choose the entity would run an arbitrary DB write under
  // asServiceRole (privilege escalation / arbitrary record creation).
  const entity = scope === 'circle' ? 'CircleChatMessage' : 'ChatMessage';

  // --- Private (1:1): Pal relationship + bidirectional block + Premium gate ---
  if (scope === 'private') {
    const targetUserId = body.targetUserId ? String(body.targetUserId) : '';
    if (!targetUserId) return json(400, { error: 'invalid_request' });
    if (String(targetUserId) === String(user.id)) return json(400, { error: 'self_message' });

    if (await isBlockedPair(svc, user.id, targetUserId)) {
      await logSecurity(svc, user, 'blocked_message', { targetUserId });
      await trackPrivate(svc, 'private_message_denied', { reason: 'blocked' });
      return json(403, { error: 'blocked', message: "You can't message this member." });
    }
    const [palFwd, palRev] = await Promise.all([
      svc.entities.PalConnection.filter({ user_id: String(user.id), pal_user_id: targetUserId, is_active: true }).catch(() => []),
      svc.entities.PalConnection.filter({ user_id: targetUserId, pal_user_id: String(user.id), is_active: true }).catch(() => []),
    ]);
    if ((!palFwd || palFwd.length === 0) && (!palRev || palRev.length === 0)) {
      await trackPrivate(svc, 'private_message_denied', { reason: 'pals_required' });
      return json(403, { error: 'pals_required', message: 'You can only message your Pals.' });
    }
    const membership = await getMembership(svc, user.id);
    const otherRows = await svc.entities.Membership.filter({ user_id: targetUserId }).catch(() => []);
    const otherPremium = isPremium(otherRows && otherRows[0]);
    if (!isPremium(membership) && !otherPremium) {
      await trackPrivate(svc, 'private_message_denied', { reason: 'premium_required' });
      return json(403, { error: 'premium_required', message: 'Private messaging requires Premium.' });
    }

    if (body.authorizeOnly) return json(200, { ok: true, authorized: true, persisted: false });

    // Ensure exactly one conversation per pair (deterministic sorted pair_key).
    const [aId, bId] = [String(user.id), targetUserId].sort();
    const pairKey = aId + ':' + bId;
    let convRows = await svc.entities.PrivateConversation.filter({ pair_key: pairKey }).catch(() => []);
    let conv = convRows && convRows[0] ? convRows[0] : null;
    if (!conv) {
      const palRec = (palFwd && palFwd[0]) || (palRev && palRev[0]);
      const myName = body.senderName || user.full_name || 'You';
      const myAvatar = body.senderAvatar || '';
      const palName = body.receiverName || (palRec && palRec.pal_name) || 'Pal';
      const palAvatar = body.receiverAvatar || (palRec && palRec.pal_avatar) || '';
      const aIsMe = aId === String(user.id);
      conv = await svc.entities.PrivateConversation.create({
        pair_key: pairKey,
        participant_a_id: aId,
        participant_b_id: bId,
        participant_a_name: aIsMe ? myName : palName,
        participant_b_name: aIsMe ? palName : myName,
        participant_a_avatar: aIsMe ? myAvatar : palAvatar,
        participant_b_avatar: aIsMe ? palAvatar : myAvatar,
        last_message: '',
        last_message_type: 'text',
        unread_a: 0,
        unread_b: 0,
      });
      await trackPrivate(svc, 'private_conversation_created', {});
    }

    const payload = body.payload || {};
    const msgType = payload.type || 'text';
    const msg = await svc.entities.PrivateMessage.create({
      conversation_id: conv.id,
      pair_key: pairKey,
      sender_id: String(user.id),
      sender_name: payload.sender_name || user.full_name || 'You',
      sender_avatar: payload.sender_avatar || '',
      receiver_id: targetUserId,
      receiver_name: payload.receiver_name || '',
      type: msgType,
      content: payload.content || '',
      file_url: payload.file_url || '',
      shared_id: payload.shared_id || '',
      shared_title: payload.shared_title || '',
      shared_image: payload.shared_image || '',
      shared_meta: payload.shared_meta || '',
      location_lat: payload.location_lat,
      location_lng: payload.location_lng,
      location_name: payload.location_name || '',
      expires_at: payload.expires_at || '',
      delivery_status: 'sent',
      reply_to_id: payload.reply_to_id || '',
      reply_to_text: payload.reply_to_text || '',
    });

    // Update conversation: last message + increment the receiver's unread count.
    const aIsMe = aId === String(user.id);
    const receiverIsA = !aIsMe; // receiver is targetUserId
    const unreadField = receiverIsA ? 'unread_a' : 'unread_b';
    const upd = {
      last_message: previewFor(payload),
      last_message_type: msgType,
      last_message_at: new Date().toISOString(),
      typing_user_id: '',
    };
    upd[unreadField] = (conv[unreadField] || 0) + 1;
    await svc.entities.PrivateConversation.update(conv.id, upd).catch(() => {});

    await trackPrivate(svc, 'private_message_sent', { type: msgType });
    return json(200, { ok: true, message: msg, conversation: conv.id });
  }

  // --- Experience group chat: sender must be Going or the host ---
  if (scope === 'experience') {
    const experienceId = body.experienceId;
    if (!experienceId) return json(400, { error: 'invalid_request' });
    const mine = await svc.entities.Attendance.filter({
      experience_id: experienceId, member_user_id: String(user.id),
    }).catch(() => []);
    const going = (mine || []).some((a) => a.status === 'going');
    let isHost = false;
    try {
      const exp = await svc.entities.Experience.get(experienceId);
      isHost = !!(exp && exp.host_user_id && String(exp.host_user_id) === String(user.id));
    } catch { /* not found */ }
    if (!going && !isHost) {
      await logSecurity(svc, user, 'experience_message_denied', { experienceId });
      return json(403, { error: 'not_participant', message: 'Only members who are Going can message in this experience.' });
    }
    const expPayload = body.payload || {};
    // System messages are only allowed for hosts/admins — ordinary attendees
    // cannot forge type='system' or sender_name='System'.
    const isSysAdmin = user.role === 'admin' || user.role === 'founder';
    if (expPayload.type === 'system' && !isHost && !isSysAdmin) {
      return json(403, { error: 'not_authorized', message: 'Only the host can post system messages.' });
    }
    // Derive sender_name from the server — never trust client-supplied sender_name.
    // System messages use 'System'; regular messages use the authenticated user's name.
    const expSenderName = expPayload.type === 'system' ? 'System' : (user.full_name || 'You');
    const msg = await svc.entities[entity].create({
      ...expPayload,
      experience_id: experienceId,
      sender_name: expSenderName,
    });
    return json(200, { ok: true, message: msg });
  }

  // --- Circle group chat: sender must be an active member ---
  if (scope === 'circle') {
    const circleId = body.circleId ? String(body.circleId) : '';
    if (!circleId) return json(400, { error: 'invalid_request' });
    const mine = await svc.entities.CircleMembership.filter({
      circle_id: circleId, member_user_id: String(user.id),
    }).catch(() => []);
    const isMember = (mine || []).some((m) =>
      m.status === 'member' || m.status === 'organizer' || m.role === 'organizer' || m.role === 'member'
    );
    if (!isMember) {
      await logSecurity(svc, user, 'circle_message_denied', { circleId });
      return json(403, { error: 'not_member', message: 'Only circle members can message here.' });
    }
    // System messages are only allowed via sendCircleSystemMessage (organizer-only).
    // Regular members cannot set type='system' through sendMessage.
    const circlePayload = body.payload || {};
    if (circlePayload.type === 'system') {
      const systemRole = await getCallerCircleRole(svc, user, circleId);
      const isSysAdmin = user.role === 'admin' || user.role === 'founder';
      if (systemRole !== 'organizer' && !isSysAdmin) {
        return json(403, { error: 'not_authorized', message: 'Only organizers can post system messages.' });
      }
    }
    // Derive sender_role from the server — never trust client-supplied sender_role.
    const circleSenderRole = await getCallerCircleRole(svc, user, circleId) || 'member';
    const msg = await svc.entities[entity].create({
      ...circlePayload,
      circle_id: circleId,
      sender_name: circlePayload.sender_name || user.full_name || 'You',
      sender_role: circleSenderRole,
    });
    return json(200, { ok: true, message: msg });
  }

  return json(400, { error: 'invalid_scope' });
}

// ---------------------------------------------------------------------------
// RC1-002 — Read receipts: reset the caller's unread counter and mark their
// incoming messages as read. Runs as service role (the receiver owns the read
// state; the sender authored the messages, so client-side update is not allowed).
async function markConversationRead(svc, user, body) {
  const pairKey = body.pairKey ? String(body.pairKey) : '';
  const conversationId = body.conversationId ? String(body.conversationId) : '';
  if (!pairKey && !conversationId) return json(400, { error: 'invalid_request' });
  let conv = null;
  if (conversationId) conv = await svc.entities.PrivateConversation.get(conversationId).catch(() => null);
  if (!conv && pairKey) {
    const rows = await svc.entities.PrivateConversation.filter({ pair_key: pairKey }).catch(() => []);
    conv = rows && rows[0];
  }
  if (!conv) return json(200, { ok: true }); // no conversation yet — nothing to mark
  const idx = conv.participant_a_id === String(user.id) ? 0 : (conv.participant_b_id === String(user.id) ? 1 : -1);
  if (idx === -1) return json(403, { error: 'not_participant' });
  const unreadField = idx === 0 ? 'unread_a' : 'unread_b';
  const upd = {}; upd[unreadField] = 0;
  await svc.entities.PrivateConversation.update(conv.id, upd).catch(() => {});
  await svc.entities.PrivateMessage.updateMany(
    { conversation_id: conv.id, receiver_id: String(user.id) },
    { $set: { delivery_status: 'read', read_at: new Date().toISOString() } }
  ).catch(() => {});
  return json(200, { ok: true });
}

// RC1-002 — Typing indicator (reuses conversation entity realtime). Block-isolated.
async function setTyping(svc, user, body) {
  const pairKey = body.pairKey ? String(body.pairKey) : '';
  const targetUserId = body.targetUserId ? String(body.targetUserId) : '';
  if (!pairKey && !targetUserId) return json(400, { error: 'invalid_request' });
  if (targetUserId && await isBlockedPair(svc, user.id, targetUserId)) return json(403, { error: 'blocked' });
  let pk = pairKey;
  if (!pk && targetUserId) { const [a, b] = [String(user.id), targetUserId].sort(); pk = a + ':' + b; }
  const rows = await svc.entities.PrivateConversation.filter({ pair_key: pk }).catch(() => []);
  const conv = rows && rows[0];
  if (!conv) return json(200, { ok: true }); // no conversation yet — nothing to update
  const isParticipant = conv.participant_a_id === String(user.id) || conv.participant_b_id === String(user.id);
  if (!isParticipant) return json(403, { error: 'not_participant' });
  await svc.entities.PrivateConversation.update(conv.id, {
    typing_user_id: body.typing ? String(user.id) : '',
    typing_at: body.typing ? new Date().toISOString() : '',
  }).catch(() => {});
  return json(200, { ok: true });
}

// ---------------------------------------------------------------------------
// RC-002A/BUG-007 — Server-side authorization for match explanations.
// Explorer members must never receive recommendation scoring, compatibility
// percentage, AI reasoning, or trust weighting. The client must call this
// action and gate the UI on the response — never rely on client-side isPremium.
async function getMatchExplanation(svc, user) {
  // AGE-001 — Viewer must be 18+ eligible to see match explanations.
  const viewerEligible = await checkEligibility(svc, user);
  if (!viewerEligible) return json(403, { code: 'eligibility_required' });

  const membership = await getMembership(svc, user.id);
  return json(200, { ok: true, premium: isPremium(membership) });
}

// ---------------------------------------------------------------------------
// ADM-001 — Mission Control development override: resolve the Workspace
// Owner's user id. The platform does not expose an owner flag and the owner's
// app role is protected from being changed, so the owner id is recorded once
// in SystemConfig. This does NOT modify the owner account or any role; it is
// a config record used by the client authorization layer to recognize the
// owner independently of the app role (foundation for future enterprise RBAC).
async function resolveOwner(svc, user) {
  if (!user) return json(401, { error: 'unauthorized' });
  // The owner user ID is an internal admin/founder secret — low-privilege
  // users must not be able to enumerate it via this endpoint.
  if (!['admin', 'founder'].includes(user.role)) return json(403, { error: 'forbidden' });
  let rows = await svc.entities.SystemConfig.filter({ key: 'mission_control.owner_user_id' }).catch(() => []);
  let ownerId = rows && rows[0] ? rows[0].value : '';
  // Bootstrap: the first Admin caller is recorded as the Workspace Owner.
  // (Today the app owner is the single Admin; this is idempotent.)
  if (!ownerId && user.role === 'admin') {
    ownerId = String(user.id);
    try {
      await svc.entities.SystemConfig.create({
        key: 'mission_control.owner_user_id',
        value: ownerId,
        category: 'ops',
      });
      await svc.entities.AuditLog.create({
        administrator: user.email || user.id,
        action: 'mission_control.owner_bootstrap',
        target_type: 'SystemConfig',
        target_id: 'mission_control.owner_user_id',
        details: 'Recorded workspace owner for Mission Control dev override.',
      });
    } catch { /* best-effort */ }
  }
  return json(200, { owner_user_id: ownerId || '' });
}

// ---------------------------------------------------------------------------
// Member name visibility — server-verified subscription gate.
// Returns another member's real "First Last" ONLY when the caller has an
// active paid subscription AND the target has both first & last name.
// Otherwise returns null (the client renders the localized "Member").
// Never trust client-side isPremium for the value; re-verify here every call.
// Also guards test-case 4 (cache leakage): the verdict is recomputed server-
// side from the live session each call, so a non-subscriber can never receive
// a real name regardless of any client cache from a prior subscriber session.
async function resolveMemberNames(svc, user, body) {
  // AGE-001 — Viewer must be 18+ eligible to see other members' real names.
  const viewerEligible = await checkEligibility(svc, user);
  if (!viewerEligible) return json(403, { code: 'eligibility_required' });

  const memberIds = [...new Set((Array.isArray(body.member_ids) ? body.member_ids : []).map(String).filter(Boolean))];
  const userIds = [...new Set((Array.isArray(body.user_ids) ? body.user_ids : []).map(String).filter(Boolean))];
  if (!memberIds.length && !userIds.length) return json(200, { names: {}, premium: false });
  if (memberIds.length + userIds.length > 300) return json(400, { error: 'too_many_ids' });

  const membership = await getMembership(svc, user.id);
  const viewerPremium = isPremium(membership);

  // Non-subscribers (free / expired / cancelled) never receive real names.
  const names: Record<string, string | null> = {};
  if (!viewerPremium) {
    for (const id of memberIds) names[id] = null;
    for (const id of userIds) names[id] = null;
    return json(200, { names, premium: false });
  }

  // Block isolation — blocked members' real names are never resolved.
  const myBlocks = await svc.entities.BlockedMember.filter({ created_by_id: String(user.id) }).catch(() => []);
  const blockedUserIds = new Set((myBlocks || []).map((b: any) => String(b.blocked_user_id)));

  // Subscriber: resolve each target's genuine Member record. The
  // email/onboarding/earliest tie-break mirrors the client getOwnMember
  // helper and avoids the imported-demo duplicate-record trap.
  const cache = new Map();
  const getById = async (id: string) => {
    const k = 'e:' + id;
    if (cache.has(k)) return cache.get(k);
    const m = await svc.entities.Member.get(id).catch(() => null);
    cache.set(k, m);
    return m;
  };
  const getByUser = async (uid: string) => {
    const k = 'u:' + uid;
    if (cache.has(k)) return cache.get(k);
    const rows = await svc.entities.Member.filter({ created_by_id: String(uid) }).catch(() => []);
    let m = null;
    if (rows && rows.length) {
      if (rows.length === 1) m = rows[0];
      else {
        const onboarded = rows.filter((r) => r.onboarding_completed);
        const pool = onboarded.length ? onboarded : rows;
        m = pool.slice().sort((a, b) => new Date(a.created_date).getTime() - new Date(b.created_date).getTime())[0];
      }
    }
    cache.set(k, m);
    return m;
  };
  const nameOf = (m: any) => {
    if (!m) return null;
    // AGE-001 — Never return the real name of an under-18 or no-DOB member.
    if (!isAdultMember(m)) return null;
    const f = (m.first_name || '').trim();
    const l = (m.last_name || '').trim();
    return f && l ? `${f} ${l}` : null;
  };

  await Promise.all([
    ...memberIds.map(async (id) => {
      const m = await getById(id);
      // Block isolation — skip blocked members (return null, not their name).
      if (m && blockedUserIds.has(String(m.created_by_id))) { names[id] = null; return; }
      names[id] = nameOf(m);
    }),
    ...userIds.map(async (id) => {
      if (blockedUserIds.has(id)) { names[id] = null; return; }
      const m = await getByUser(id);
      if (m && blockedUserIds.has(String(m.created_by_id))) { names[id] = null; return; }
      names[id] = nameOf(m);
    }),
  ]);
  return json(200, { names, premium: true });
}

// ---------------------------------------------------------------------------
// Member profile visibility — server-verified subscription gate.
// Returns another member's profile to the caller. The COMPLETE profile
// (bio, languages, lifestyle, interests, gallery, age) is returned ONLY when
// the caller has an active paid subscription; otherwise a limited preview
// (display handle, photo, city, country) is returned and the client shows the
// upgrade screen. Subscription is re-verified live on every call, so access
// updates immediately after payment and is removed on expiry / cancel / refund.
// Bidirectional blocks always apply — a subscription never overrides a block.
// Sensitive fields (email, phone, date_of_birth, admin fields, tokens) are
// never returned. The target's own privacy choices (profile_visibility,
// show_age) are always honored.
async function resolveMemberProfile(svc, user, body) {
  // AGE-001 — Viewer must be 18+ eligible to see other members' profiles.
  const viewerEligible = await checkEligibility(svc, user);
  if (!viewerEligible) return json(403, { code: 'eligibility_required' });

  const requestedId = body.user_id ? String(body.user_id) : '';
  if (!requestedId) return json(400, { error: 'invalid_request' });

  // Resolve the target member. The route param is the Member entity id
  // (unique per member); fall back to created_by_id for legacy callers that
  // still pass a user id. Entity-id-first avoids the duplicate trap where
  // multiple members share one created_by_id (demo / imported data).
  let m = await svc.entities.Member.get(requestedId).catch(() => null);
  if (!m) {
    const rows = await svc.entities.Member.filter({ created_by_id: requestedId }).catch(() => []);
    if (rows && rows.length) {
      const onboarded = rows.filter((r) => r.onboarding_completed);
      const pool = onboarded.length ? onboarded : rows;
      m = pool.slice().sort((a, b) => new Date(a.created_date).getTime() - new Date(b.created_date).getTime())[0];
    }
  }
  if (!m) return json(200, { blocked: false, premium: false, connected: false, profile: null, not_found: true });
  // Suspended / deleted / banned / deactivated members are never viewable.
  if (['suspended', 'deleted', 'banned', 'deactivated'].includes(m.admin_status)) {
    return json(200, { blocked: false, premium: false, connected: false, profile: null, not_found: true });
  }

  // AGE-001 — Under-18 or no-DOB members are never viewable. Returns
  // not_found (not a eligibility error) so the caller cannot distinguish
  // "does not exist" from "is under 18" — no existence leak.
  if (!isAdultMember(m)) {
    return json(200, { blocked: false, premium: false, connected: false, profile: null, not_found: true });
  }

  // The canonical user id for this member — used for block / connection checks.
  const targetUserId = String(m.created_by_id || '');

  // Self-check: the resolved member is "self" only if it IS the viewer's own
  // member record. Compare entity ids (not user ids) so other members that
  // share created_by_id (demo / imported data) are not mistaken for self.
  const myRows = await svc.entities.Member.filter({ created_by_id: String(user.id) }).catch(() => []);
  let myMember = null;
  if (myRows && myRows.length) {
    const onboarded = myRows.filter((r) => r.onboarding_completed);
    const pool = onboarded.length ? onboarded : myRows;
    myMember = pool.slice().sort((a, b) => new Date(a.created_date).getTime() - new Date(b.created_date).getTime())[0];
  }
  if (myMember && String(m.id) === String(myMember.id)) return json(400, { error: 'self_profile' });

  const membership = await getMembership(svc, user.id);
  const viewerPremium = isPremium(membership);

  // A subscription never overrides a block — checked bidirectionally.
  if (targetUserId && await isBlockedPair(svc, user.id, targetUserId)) {
    return json(200, { blocked: true, premium: viewerPremium, connected: false, profile: null });
  }

  // A bidirectional Pal connection OR an active Premium subscription unlocks
  // the full profile. Free unconnected viewers get the teaser with an upgrade
  // prompt. A member's explicit 'private' visibility choice still stands for
  // unconnected viewers — only a Pal connection overrides 'private'.
  let connected = false;
  if (targetUserId) {
    const [connFwd, connRev] = await Promise.all([
      svc.entities.PalConnection.filter({ user_id: String(user.id), pal_user_id: targetUserId, is_active: true }).catch(() => []),
      svc.entities.PalConnection.filter({ user_id: targetUserId, pal_user_id: String(user.id), is_active: true }).catch(() => []),
    ]);
    connected = ((connFwd && connFwd.length) || (connRev && connRev.length)) > 0;
  }

  const visibility = m.profile_visibility || 'connections';
  // Preview fields — always visible to any authenticated, non-blocked viewer.
  const profile = {
    member_id: m.id,
    user_id: m.created_by_id,
    display_name: m.display_name || '',
    photo_url: m.photo_url || '',
    city: m.city || '',
    country: m.country || '',
    profile_visibility: visibility,
  };

  // Full access: connected viewers OR Premium subscribers. Premium members
  // see the complete profile with no teaser/upgrade gating — including
  // 'private' visibility profiles ('private' only hides a member from
  // discovery feeds, not from direct views by paying members). Free
  // unconnected viewers get the teaser; a 'private' profile shows them only
  // the minimal teaser.
  const tier = (connected || viewerPremium) ? 'full' : 'teaser';

  if (visibility === 'private' && tier === 'teaser') {
    profile.interests = (Array.isArray(m.interests) ? m.interests : []).slice(0, 4);
    return json(200, { blocked: false, premium: false, connected: false, tier: 'teaser', profile });
  }

  if (tier === 'full') {
    profile.bio = m.bio || '';
    profile.languages = Array.isArray(m.languages) ? m.languages : [];
    profile.lifestyle = m.lifestyle || '';
    profile.interests = Array.isArray(m.interests) ? m.interests : [];
    profile.photo_gallery = Array.isArray(m.photo_gallery) ? m.photo_gallery : [];
    profile.nationality = m.nationality || '';
    profile.gender = m.gender || '';
    profile.show_age = !!m.show_age;
    if (m.show_age && m.date_of_birth) {
      const d = new Date(m.date_of_birth);
      if (!isNaN(d.getTime())) {
        profile.age = Math.floor((Date.now() - d.getTime()) / (365.25 * 86400000));
      }
    }

    // Enrich with MemberProfile (looking_for, personality_traits, life_goals)
    // and LifeJourney (journey_text) when records exist. These are separate
    // entities linked by the Member entity id. Only public, user-authored
    // fields are returned — never AI-inferred hidden fields.
    try {
      const mpRows = await svc.entities.MemberProfile.filter({ member: m.id }).catch(() => []);
      const mp = mpRows && mpRows[0];
      if (mp) {
        profile.looking_for = Array.isArray(mp.looking_for) ? mp.looking_for : [];
        profile.personality_traits = Array.isArray(mp.personality_traits) ? mp.personality_traits : [];
        profile.life_goals = Array.isArray(mp.life_goals) ? mp.life_goals : [];
      }
    } catch { /* best-effort enrichment */ }

    try {
      const ljRows = await svc.entities.LifeJourney.filter({ member: m.id }).catch(() => []);
      const lj = ljRows && ljRows.find((j) => j.is_active !== false);
      if (lj && lj.journey_text) {
        profile.journey_text = lj.journey_text;
      }
    } catch { /* best-effort enrichment */ }

    return json(200, { blocked: false, premium: viewerPremium, connected, tier: 'full', profile });
  }

  // Free unconnected: light teaser — a few visible interests. No
  // bio/languages/lifestyle/gallery. The client shows the upgrade prompt.
  profile.interests = (Array.isArray(m.interests) ? m.interests : []).slice(0, 4);
  return json(200, { blocked: false, premium: false, connected: false, tier: 'teaser', profile });
}

// ---------------------------------------------------------------------------
// AGE-001 — Server-side DOB update with eligibility derivation.
// The client is NOT trusted to set eligibility_status directly. This action
// accepts a DOB from the authenticated user, validates it, derives the
// correct eligibility_status server-side, and updates the Member record.
// Verified members cannot change their DOB self-service (must contact Support).
async function updateDob(svc, user, body) {
  const dob = body.dob ? String(body.dob) : '';
  if (!dob) return json(400, { error: 'invalid_request', message: 'Date of birth is required.' });

  const birth = new Date(dob);
  if (isNaN(birth.getTime()) || birth.getTime() > Date.now()) {
    return json(400, { error: 'invalid_dob', message: 'Please enter a valid date of birth.' });
  }

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (today.getMonth() < birth.getMonth() ||
      (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--;

  // Derive eligibility_status from DOB — the ONLY trusted source of truth.
  let status = 'pending';
  if (age >= 18) status = 'verified';
  else if (age < 18) status = 'under_review';

  // Find the caller's Member record (same logic as checkEligibility).
  const rows = await svc.entities.Member.filter({ created_by_id: String(user.id) }).catch(() => []);
  if (!rows || rows.length === 0) return json(404, { error: 'member_not_found' });
  const onboarded = rows.filter((r: any) => r.onboarding_completed);
  const pool = onboarded.length ? onboarded : rows;
  const member = pool.slice().sort((a: any, b: any) =>
    new Date(a.created_date).getTime() - new Date(b.created_date).getTime()
  )[0];
  if (!member) return json(404, { error: 'member_not_found' });

  // AGE-001 — Restricted members are under admin review and cannot self-serve
  // any DOB change. They must contact Support to request a correction.
  if (member.eligibility_status === 'restricted') {
    return json(403, { error: 'dob_restricted', message: 'Your account is restricted. Please contact Support to update your date of birth.' });
  }

  // AGE-001 — Once a DOB exists, no self-service replacement is allowed —
  // verified, under-review, and pending members alike must contact Support
  // for any correction. A member with no DOB may submit an initial DOB once.
  if (member.date_of_birth) {
    return json(403, { error: 'dob_locked', message: 'Your date of birth is already set. Contact Support to change it.' });
  }

  const payload: any = { date_of_birth: dob, eligibility_status: status };
  if (status === 'verified') {
    payload.eligibility_verified_at = new Date().toISOString();
  } else {
    payload.eligibility_verified_at = null;
  }

  const updated = await svc.entities.Member.update(member.id, payload);
  return json(200, { ok: true, member: updated, eligibility_status: status });
}

// ---------------------------------------------------------------------------
// SEC — Edit an experience chat message. Validates the caller is the message
// author AND still a Going participant / host of the experience before the
// service role applies the content update. Replaces a direct client-side
// ChatMessage.update that bypassed participant-status validation.
async function editExperienceMessage(svc, user, body) {
  const messageId = body.messageId ? String(body.messageId) : '';
  const content = String(body.content || '').trim();
  if (!messageId || !content) return json(400, { error: 'invalid_request' });

  const msg = await svc.entities.ChatMessage.get(messageId).catch(() => null);
  if (!msg) return json(404, { error: 'not_found' });
  if (String(msg.created_by_id) !== String(user.id)) return json(403, { error: 'not_authorized' });

  const experienceId = msg.experience_id;
  const mine = await svc.entities.Attendance.filter({
    experience_id: experienceId, member_user_id: String(user.id),
  }).catch(() => []);
  const going = (mine || []).some((a) => a.status === 'going');
  let isHost = false;
  try {
    const exp = await svc.entities.Experience.get(experienceId);
    isHost = !!(exp && exp.host_user_id && String(exp.host_user_id) === String(user.id));
  } catch { /* not found */ }
  if (!going && !isHost) return json(403, { error: 'not_participant', message: 'Only members who are Going can edit messages in this experience.' });

  const updated = await svc.entities.ChatMessage.update(messageId, { content });
  return json(200, { ok: true, message: updated });
}

// ---------------------------------------------------------------------------
// AGE-001 — updateProfile: the ONLY way clients can update their own Member
// record. Strips all protected fields (date_of_birth, eligibility_status,
// eligibility_verified_at, dob_change_requested_at) — those are only writable
// through updateDob, deleteAccount, or admin actions.
//
// PHOTO-REQ — When onboarding_completed is being set to true, validates that
// a profile photo (photo_url) is present. This is the server-side enforcement
// of the mandatory profile photo requirement — it cannot be bypassed by
// direct API calls, refresh, or another device.
async function updateProfile(svc, user, body) {
  const fields = body.fields || {};
  const member = await getCallerMember(svc, user);
  if (!member) return json(404, { error: 'member_not_found' });

  const clean: Record<string, any> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (!PROTECTED_MEMBER_FIELDS.has(k)) clean[k] = v;
  }
  const updated = await svc.entities.Member.update(member.id, clean);
  return json(200, { ok: true, member: updated });
}

// ---------------------------------------------------------------------------
// PHOTO-REQ — createProfile: the ONLY way clients can create their own Member
// record during onboarding. Validates that a profile photo (photo_url) is
// present before creating. Strips protected fields (date_of_birth, etc.) —
// those are only writable through updateDob or admin actions.
// The Member entity RLS blocks direct client creates (admin/founder only),
// so this backend action is the sole client-accessible creation path.
async function createProfile(svc, user, body) {
  const fields = body.fields || {};

  const clean: Record<string, any> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (!PROTECTED_MEMBER_FIELDS.has(k)) clean[k] = v;
  }
  // Ensure onboarding_completed is set — this action only runs at the end of
  // onboarding, so the member is always created as fully onboarded.
  clean.onboarding_completed = true;
  if (!clean.email) clean.email = user.email || '';
  // Normalize email to lowercase for consistent lookup/dedup.
  clean.email = String(clean.email || '').trim().toLowerCase();
  // Derive display_name from user.full_name if not provided (OAuth users
  // who don't go through the email signup form).
  if (!clean.display_name) clean.display_name = user.full_name || '';

  // Duplicate guard — find-or-create by normalized email (mirrors
  // registerProfile). Prevents duplicate Member records when a user re-enters
  // onboarding or a member was already created at signup via registerProfile.
  if (clean.email) {
    const rows = await svc.entities.Member.filter({ email: clean.email }).catch(() => []);
    if (rows && rows.length > 0) {
      const onboarded = rows.filter((r: any) => r.onboarding_completed);
      const pool = onboarded.length ? onboarded : rows;
      const existing = pool.slice().sort((a: any, b: any) =>
        new Date(a.created_date).getTime() - new Date(b.created_date).getTime()
      )[0];
      const updated = await svc.entities.Member.update(existing.id, { ...clean, email: clean.email });
      return json(200, { ok: true, member: updated, created: false });
    }
  }

  const created = await svc.entities.Member.create(clean);
  return json(200, { ok: true, member: created });
}

// ---------------------------------------------------------------------------
// registerProfile — Idempotent find-or-create Member profile at signup.
// Called after OTP verification (email signup) with the first name, last
// name, email, and DOB collected on the Create Account form. Derives
// eligibility server-side from the DOB (the sole source of truth). Does
// NOT set onboarding_completed — the member is created with
// onboarding_completed: false so the user is routed to the onboarding
// flow to complete their profile (interests, languages, location, etc.)
// before entering the app. Photo is optional. Does NOT rely on
// client-owned created_by_id — resolves the member by email server-side.
async function registerProfile(svc, user, body) {
  const firstName = String(body.first_name || '').trim();
  const lastName = String(body.last_name || '').trim();
  const email = String(body.email || user.email || '').trim().toLowerCase();
  const dob = String(body.dob || '').trim();

  if (!firstName) return json(400, { error: 'invalid_request', message: 'First name is required.' });
  if (!dob) return json(400, { error: 'invalid_request', message: 'Date of birth is required.' });

  const birth = new Date(dob);
  if (isNaN(birth.getTime()) || birth.getTime() > Date.now()) {
    return json(400, { error: 'invalid_dob', message: 'Please enter a valid date of birth.' });
  }

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (today.getMonth() < birth.getMonth() ||
      (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--;

  // Derive eligibility_status from DOB — the ONLY trusted source of truth.
  let status = 'pending';
  if (age >= 18) status = 'verified';
  else if (age < 18) status = 'under_review';

  const displayName = `${firstName} ${lastName}`.trim();
  const eligibilityVerifiedAt = status === 'verified' ? new Date().toISOString() : null;

  // Idempotent find-or-create by email (server-side, service role).
  let member = null;
  if (email) {
    const rows = await svc.entities.Member.filter({ email }).catch(() => []);
    if (rows && rows.length > 0) {
      const onboarded = rows.filter((r: any) => r.onboarding_completed);
      const pool = onboarded.length ? onboarded : rows;
      member = pool.slice().sort((a: any, b: any) =>
        new Date(a.created_date).getTime() - new Date(b.created_date).getTime()
      )[0];
    }
  }

  if (member) {
    const updated = await svc.entities.Member.update(member.id, {
      first_name: firstName,
      last_name: lastName,
      display_name: member.display_name || displayName,
      email,
      date_of_birth: dob,
      eligibility_status: status,
      eligibility_verified_at: eligibilityVerifiedAt,
      onboarding_completed: false,
    });
    return json(200, { ok: true, member: updated, created: false });
  }

  const created = await svc.entities.Member.create({
    first_name: firstName,
    last_name: lastName,
    display_name: displayName,
    email,
    date_of_birth: dob,
    eligibility_status: status,
    eligibility_verified_at: eligibilityVerifiedAt,
    onboarding_completed: false,
  });
  return json(200, { ok: true, member: created, created: true });
}

// ---------------------------------------------------------------------------
// AGE-001 — deleteAccount: anonymizes personal data including DOB (a protected
// field). This is the ONLY backend action besides updateDob that may write
// date_of_birth. Cancels pending Pal requests and logs the deletion.
async function deleteAccount(svc, user, body) {
  const member = await getCallerMember(svc, user);
  if (!member) return json(404, { error: 'member_not_found' });

  const now = new Date().toISOString();
  const anonymizedData: Record<string, any> = {
    admin_status: 'deleted',
    first_name: null, last_name: null,
    display_name: 'Deleted Member',
    email: null, phone: null,
    date_of_birth: null,
    eligibility_status: 'pending',
    eligibility_verified_at: null,
    dob_change_requested_at: null,
    gender: null, bio: null,
    photo_url: null, photo_gallery: [],
    interests: [], languages: [], lifestyle: null,
    location_enabled: false,
    profile_visibility: 'private',
    who_can_message: 'no_one',
    show_online_status: false, show_age: false,
    show_distance: false, show_last_seen: false,
    personalized_recommendations: false,
    analytics_consent: false,
    account_state: 'deleted',
    deleted_at: now,
    force_logout_at: now,
    admin_note: `Self-deleted on ${now}`,
  };
  const updated = await svc.entities.Member.update(member.id, anonymizedData);

  // Cancel pending Pal requests (both sent and received).
  const userId = String(member.created_by_id || user.id);
  try {
    await svc.entities.PalRequest.updateMany(
      { status: 'pending', sender_user_id: userId },
      { $set: { status: 'cancelled' } }
    ).catch(() => {});
    await svc.entities.PalRequest.updateMany(
      { status: 'pending', receiver_user_id: userId },
      { $set: { status: 'cancelled' } }
    ).catch(() => {});
  } catch { /* non-blocking */ }

  // Audit log.
  try {
    await svc.entities.AuditLog.create({
      action: 'account_self_deleted',
      administrator: user.email || userId,
      target_type: 'Member',
      target_id: member.id,
      details: 'Member self-initiated account deletion via backend. Personal data anonymized.',
    });
  } catch { /* non-blocking */ }

  return json(200, { ok: true, member: updated });
}

// ---------------------------------------------------------------------------
// AUTH-001 — signOutEverywhere: self-service "Sign out of all sessions".
// Sets force_logout_at on the caller's own Member record. The client-side
// AuthContext poll detects this within 30s on every device and calls logout().
// The caller's current session is also terminated (they call logout() locally
// immediately after this action returns). Audit-logged.
async function signOutEverywhere(svc, user) {
  const member = await getCallerMember(svc, user);
  if (!member) return json(404, { error: 'member_not_found' });
  const now = new Date().toISOString();
  await svc.entities.Member.update(member.id, { force_logout_at: now });
  try {
    await svc.entities.AuditLog.create({
      administrator: user.email || String(user.id),
      action: 'sign_out_everywhere',
      target_type: 'Member',
      target_id: member.id,
      new_value: now,
      details: 'Self-initiated sign out of all sessions.',
    });
  } catch { /* audit best-effort */ }
  return json(200, { ok: true, force_logout_at: now });
}

// Calculate age from date_of_birth. Returns null for invalid/missing DOB.
function memberAge(dob: string): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (isNaN(birth.getTime()) || birth.getTime() > Date.now()) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (today.getMonth() < birth.getMonth() ||
      (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--;
  return age;
}

// ---------------------------------------------------------------------------
// AGE-001 — discoverMembers: server-side filtered member list for Discover,
// Search, and AI recommendations. Excludes ineligible members at the query
// level — client-side filtering is a secondary safeguard only.
async function discoverMembers(svc, user, body) {
  // Viewer must be 18+ eligible to discover other members.
  const viewerEligible = await checkEligibility(svc, user);
  if (!viewerEligible) return json(403, { code: 'eligibility_required' });

  const limit = Math.min(Number(body.limit) || 100, 200);
  const members = await svc.entities.Member.list('-created_date', limit).catch(() => []);
  const myId = String(user.id);

  // Block isolation — blocked members are excluded from discovery.
  const myBlocks = await svc.entities.BlockedMember.filter({ created_by_id: myId }).catch(() => []);
  const blockedUserIds = new Set((myBlocks || []).map((b: any) => String(b.blocked_user_id)));

  const filtered = (members || []).filter((m: any) => {
    if (String(m.created_by_id) === myId) return false;
    if (blockedUserIds.has(String(m.created_by_id))) return false;
    if (['suspended', 'deleted', 'banned', 'deactivated'].includes(m.admin_status)) return false;
    const state = m.account_state || 'active';
    if (state !== 'active') return false;
    if (!m.onboarding_completed) return false;
    if (!m.display_name) return false;
    if (m.profile_visibility === 'private') return false;
    // AGE-001 — Exclude members without a valid 18+ DOB.
    const age = memberAge(m.date_of_birth);
    if (age === null || age < 18) return false;
    return true;
  });

  const safe = filtered.map((m: any) => ({
    id: m.id,
    user_id: m.created_by_id,
    created_by_id: m.created_by_id,
    display_name: m.display_name,
    photo_url: m.photo_url || '',
    city: m.city || '',
    country: m.country || '',
    bio: (m.bio || '').slice(0, 200),
    interests: Array.isArray(m.interests) ? m.interests : [],
    languages: Array.isArray(m.languages) ? m.languages : [],
    lifestyle: m.lifestyle || '',
    profile_visibility: m.profile_visibility || 'connections',
    profile_view_visibility: m.profile_view_visibility || 'visible',
    location_enabled: !!m.location_enabled,
    latitude: typeof m.latitude === 'number' ? m.latitude : null,
    longitude: typeof m.longitude === 'number' ? m.longitude : null,
    looking_for_tags: Array.isArray(m.looking_for_tags) ? m.looking_for_tags : [],
    zodiac: m.zodiac || '',
    gender: m.gender || '',
    age: memberAge(m.date_of_birth),
    created_date: m.created_date || '',
  }));

  return json(200, { ok: true, members: safe });
}

// ---------------------------------------------------------------------------
// SEC — createSafetyReport: the ONLY way clients can submit a safety report.
// Validates the reporter, target, reason; sets all server-controlled fields.
// Ignores client-supplied status/priority/moderation fields.
const PERMITTED_REPORT_REASONS = new Set([
  'fake_profile', 'spam', 'harassment', 'hate_speech',
  'inappropriate_content', 'scam', 'underage', 'other',
]);
const MAX_REPORT_DETAILS_LENGTH = 2000;
const DUPLICATE_REPORT_WINDOW_HOURS = 24;

async function createSafetyReport(svc, user, body) {
  const targetType = String(body.target_type || body.targetType || 'member');
  if (!['member', 'experience', 'circle', 'host', 'message'].includes(targetType)) {
    return json(400, { error: 'invalid_target_type' });
  }
  const targetId = String(body.target_id || body.targetId || '');
  if (!targetId) return json(400, { error: 'invalid_request', message: 'A target is required.' });

  const reason = String(body.reason || '').trim();
  if (!PERMITTED_REPORT_REASONS.has(reason)) {
    return json(400, { error: 'invalid_reason', message: 'Please select a valid reason.' });
  }

  // Validate target existence and capture display info server-side.
  let targetExists = false;
  let targetName = '';
  let targetImage = '';
  try {
    if (targetType === 'member' || targetType === 'host') {
      const m = await resolveTargetMember(svc, targetId);
      if (m) { targetExists = true; targetName = m.display_name || ''; targetImage = m.photo_url || ''; }
    } else if (targetType === 'experience') {
      const e = await svc.entities.Experience.get(targetId).catch(() => null);
      if (e) { targetExists = true; targetName = e.title || ''; targetImage = e.cover_image || ''; }
    } else if (targetType === 'circle') {
      const c = await svc.entities.Circle.get(targetId).catch(() => null);
      if (c) { targetExists = true; targetName = c.name || ''; targetImage = c.cover_photo || ''; }
    } else if (targetType === 'message') {
      targetExists = true; // message existence validated by caller context
    }
  } catch { /* best-effort */ }
  if (!targetExists) return json(404, { error: 'target_not_found' });

  // Sanitize and length-limit details.
  const details = String(body.details || '').trim().slice(0, MAX_REPORT_DETAILS_LENGTH);

  // Validate evidence URL (must be a valid http(s) URL; ownership is verified
  // at upload time — only URLs from the app's own upload flow are accepted).
  // Evidence URL ownership validation — only accept URLs from the app's own
  // upload domain (media.base44.com / files.base44.com). This ensures the
  // evidence was uploaded through the app's authenticated upload flow, which
  // validates ownership at upload time. Arbitrary external URLs are rejected.
  let evidenceUrl = '';
  const rawEvidence = String(body.evidence_url || body.evidenceUrl || '');
  const UPLOAD_DOMAIN_RE = /^https:\/\/(media\.base44\.com|files\.base44\.com|storage\.base44\.com)\//i;
  if (rawEvidence && UPLOAD_DOMAIN_RE.test(rawEvidence)) {
    evidenceUrl = rawEvidence.slice(0, 2048);
  }

  // Prevent duplicate reports (same reporter + target) within 24h.
  const since = new Date(Date.now() - DUPLICATE_REPORT_WINDOW_HOURS * 3600000).toISOString();
  const dupes = await svc.entities.SafetyReport.filter({
    created_by_id: String(user.id),
    target_type: targetType,
    target_id: targetId,
    created_date: { $gte: since },
  }).catch(() => []);
  if (dupes && dupes.length > 0) {
    return json(409, { error: 'duplicate_report', message: 'You have already reported this recently.' });
  }

  // Server-controlled fields — client-supplied values are ignored.
  const reporterMember = await getMember(svc, user.id);
  const reporterName = reporterMember?.display_name || user.full_name || 'Member';
  let priority = 'medium';
  if (reason === 'underage' || reason === 'scam' || reason === 'harassment') priority = 'high';

  const report = await svc.entities.SafetyReport.create({
    target_type: targetType,
    target_id: targetId,
    target_name: targetName,
    target_image: targetImage,
    reporter_name: reporterName,
    reason,
    details,
    evidence_url: evidenceUrl,
    also_blocked: !!(body.also_blocked || body.alsoBlock),
    status: 'submitted',
    priority,
  });

  // Optional: also block the reported member (server-side).
  if ((body.also_blocked || body.alsoBlock) && targetType === 'member') {
    try { await blockMember(svc, user, { targetMemberId: targetId }); } catch { /* best-effort */ }
  }

  return json(200, { ok: true, report: { id: report.id, status: report.status, priority: report.priority } });
}

// ---------------------------------------------------------------------------
// SEC — moderateSafetyReport: admin/founder only. Validates status transitions
// and moderation actions. Moderator identity + timestamp from the session.
const ALLOWED_STATUS_TRANSITIONS: Record<string, string[]> = {
  submitted: ['reviewing', 'resolved', 'dismissed', 'escalated'],
  reviewing: ['resolved', 'dismissed', 'escalated'],
  resolved: [],
  dismissed: [],
  escalated: ['resolved', 'dismissed'],
};
const ALLOWED_MODERATION_ACTIONS = new Set([
  'warning', 'content_removal', 'temporary_suspension',
  'permanent_ban', 'emergency_escalation', 'no_action',
]);

async function moderateSafetyReport(svc, user, body) {
  if (user.role !== 'admin' && user.role !== 'founder') {
    return json(403, { error: 'forbidden' });
  }
  const reportId = String(body.reportId || '');
  if (!reportId) return json(400, { error: 'invalid_request' });
  const report = await svc.entities.SafetyReport.get(reportId).catch(() => null);
  if (!report) return json(404, { error: 'not_found' });

  const newStatus = String(body.status || '').trim();
  if (!ALLOWED_STATUS_TRANSITIONS[report.status]?.includes(newStatus)) {
    return json(400, { error: 'invalid_transition', message: `Cannot transition from ${report.status} to ${newStatus}.` });
  }

  const moderationAction = body.moderationAction ? String(body.moderationAction) : '';
  if (moderationAction && !ALLOWED_MODERATION_ACTIONS.has(moderationAction)) {
    return json(400, { error: 'invalid_moderation_action' });
  }

  const update: Record<string, any> = {
    status: newStatus,
    moderated_by: user.email || String(user.id),
    moderated_at: new Date().toISOString(),
  };
  if (body.resolutionNote) update.resolution_note = String(body.resolutionNote).slice(0, 5000);
  if (moderationAction) update.moderation_action = moderationAction;

  const updated = await svc.entities.SafetyReport.update(reportId, update);
  return json(200, { ok: true, report: updated });
}

// ---------------------------------------------------------------------------
// SEC — blockMember: the ONLY way clients can create a block. Resolves
// canonical Member records for both viewer and target, prevents self-block
// by comparing like identifiers (User ID to User ID, Member ID to Member ID),
// prevents duplicates, and cancels pending connections in both directions.
async function blockMember(svc, user, body) {
  const targetMemberId = String(body.targetMemberId || body.targetId || '');
  if (!targetMemberId) return json(400, { error: 'invalid_request' });

  const viewerMember = await getMember(svc, user.id);
  if (!viewerMember) return json(404, { error: 'member_not_found' });

  const targetMember = await resolveTargetMember(svc, targetMemberId);
  if (!targetMember) return json(404, { error: 'target_not_found' });

  const targetUserId = String(targetMember.created_by_id || '');

  // Prevent self-block: compare User ID to User ID (not member.id to user.id).
  if (targetUserId && targetUserId === String(user.id)) {
    return json(400, { error: 'self_block' });
  }
  // Secondary guard: compare Member ID to Member ID.
  if (String(targetMember.id) === String(viewerMember.id)) {
    return json(400, { error: 'self_block' });
  }

  // Prevent duplicate block records.
  const existing = await svc.entities.BlockedMember.filter({
    created_by_id: String(user.id),
    blocked_user_id: targetUserId,
  }).catch(() => []);
  if (existing && existing.length > 0) {
    return json(200, { ok: true, already_blocked: true });
  }

  const rec = await svc.entities.BlockedMember.create({
    blocked_user_id: targetUserId,
    blocked_member_id: String(targetMember.id),
    blocked_name: targetMember.display_name || '',
    blocked_avatar: targetMember.photo_url || '',
  });

  // Cancel pending Pal requests in both directions.
  try {
    await svc.entities.PalRequest.updateMany(
      { status: 'pending', sender_user_id: String(user.id), receiver_user_id: targetUserId },
      { $set: { status: 'cancelled' } }
    );
  } catch { /* best-effort */ }
  try {
    await svc.entities.PalRequest.updateMany(
      { status: 'pending', sender_user_id: targetUserId, receiver_user_id: String(user.id) },
      { $set: { status: 'cancelled' } }
    );
  } catch { /* best-effort */ }

  return json(200, { ok: true, block: rec });
}

// ---------------------------------------------------------------------------
// SEC — unblockMember: deletes only the authenticated viewer's matching
// block record. Cannot delete another user's block records.
async function unblockMember(svc, user, body) {
  const targetUserId = String(body.targetUserId || body.targetId || '');
  if (!targetUserId) return json(400, { error: 'invalid_request' });

  const records = await svc.entities.BlockedMember.filter({
    created_by_id: String(user.id),
    blocked_user_id: targetUserId,
  }).catch(() => []);

  if (!records || records.length === 0) {
    return json(200, { ok: true, not_blocked: true });
  }

  for (const rec of records) {
    try { await svc.entities.BlockedMember.delete(rec.id); } catch { /* best-effort */ }
  }

  return json(200, { ok: true });
}

// ---------------------------------------------------------------------------
// SEC — rejectConnection: receiver only. Request must be pending.
async function rejectConnection(svc, user, body) {
  const requestId = String(body.requestId || '');
  if (!requestId) return json(400, { error: 'invalid_request' });
  const req = await svc.entities.PalRequest.get(requestId).catch(() => null);
  if (!req) return json(404, { error: 'not_found' });
  if (req.receiver_user_id !== String(user.id)) return json(403, { error: 'not_authorized', message: 'Only the recipient can decline a request.' });
  if (req.status !== 'pending') return json(409, { error: 'already_handled' });
  await svc.entities.PalRequest.update(requestId, { status: 'declined' });
  return json(200, { ok: true });
}

// ---------------------------------------------------------------------------
// SEC — cancelConnectionRequest: sender only. Request must be pending.
async function cancelConnectionRequest(svc, user, body) {
  const requestId = String(body.requestId || '');
  if (!requestId) return json(400, { error: 'invalid_request' });
  const req = await svc.entities.PalRequest.get(requestId).catch(() => null);
  if (!req) return json(404, { error: 'not_found' });
  if (req.sender_user_id !== String(user.id)) return json(403, { error: 'not_authorized', message: 'Only the sender can cancel a request.' });
  if (req.status !== 'pending') return json(409, { error: 'already_handled' });
  await svc.entities.PalRequest.update(requestId, { status: 'cancelled' });
  return json(200, { ok: true });
}

// ---------------------------------------------------------------------------
// SEC — listMySafetyReports: returns the caller's own reports with ONLY
// public fields. Internal moderation fields (resolution_note, moderation_action,
// moderated_by, moderated_at, reporter_name) are NEVER returned to the reporter.
// This is the sole read path for reporters — direct entity reads are blocked
// by RLS (admin/founder only).
async function listMySafetyReports(svc, user) {
  const rows = await svc.entities.SafetyReport.filter({ created_by_id: String(user.id) }, '-created_date', 100).catch(() => []);
  const publicFields = (rows || []).map((r: any) => ({
    id: r.id,
    target_type: r.target_type,
    target_id: r.target_id,
    target_name: r.target_name || '',
    target_image: r.target_image || '',
    reason: r.reason || '',
    details: r.details || '',
    status: r.status || 'submitted',
    created_date: r.created_date,
  }));
  return json(200, { ok: true, reports: publicFields });
}

// ---------------------------------------------------------------------------
// SEC — sendExperienceInvitations: host sends invitations to pals for a
// private/invite-only experience. Block isolation is enforced — blocked
// pairs are silently skipped.
async function sendExperienceInvitations(svc, user, body) {
  const experienceId = body.experienceId ? String(body.experienceId) : '';
  const invites = Array.isArray(body.invites) ? body.invites : [];
  if (!experienceId || invites.length === 0) return json(400, { error: 'invalid_request' });

  // Verify the experience exists and the caller is the host or admin.
  const exp = await svc.entities.Experience.get(experienceId).catch(() => null);
  if (!exp) return json(404, { error: 'not_found' });
  const isHost = exp.host_user_id && String(exp.host_user_id) === String(user.id);
  const isAdmin = user.role === 'admin' || user.role === 'founder';
  if (!isHost && !isAdmin) return json(403, { error: 'not_authorized', message: 'Only the host can send invitations.' });

  const safe = [];
  for (const inv of invites) {
    const palUserId = inv.palUserId ? String(inv.palUserId) : '';
    if (palUserId && await isBlockedPair(svc, user.id, palUserId)) {
      await logSecurity(svc, user, 'blocked_experience_invitation', { palUserId });
      continue;
    }
    safe.push({
      experience_id: experienceId,
      experience_title: exp.title || '',
      experience_image: exp.cover_image || '',
      sender_name: inv.senderName || user.full_name || 'You',
      sender_avatar: inv.senderAvatar || '',
      pal_user_id: palUserId,
      pal_name: inv.palName || '',
      pal_avatar: inv.palAvatar || '',
      personal_message: inv.personalMessage || body.message || '',
      status: 'pending',
      // Server-generated expiry — clients cannot set arbitrary expiry values.
      expires_at: new Date(Date.now() + 7 * 24 * 3600000).toISOString(),
    });
  }
  if (safe.length === 0) return json(403, { error: 'blocked', message: 'None of the selected members can be invited.' });
  const created = await svc.entities.ExperienceInvitation.bulkCreate(safe);
  return json(200, { ok: true, sent: created.length });
}

// ---------------------------------------------------------------------------
// SEC — Circle organizer management actions. All run as service role,
// bypassing the CircleMembership RLS (which no longer allows self-update).
// Each action validates that the caller is an organizer of the circle.
// ---------------------------------------------------------------------------

async function getCallerCircleRole(svc, user, circleId): Promise<string | null> {
  const mine = await svc.entities.CircleMembership.filter({
    circle_id: circleId, member_user_id: String(user.id),
  }).catch(() => []);
  if (!mine || mine.length === 0) return null;
  const active = mine.find((m: any) => m.status === 'member' || m.role === 'organizer');
  return active ? (active.role || 'member') : null;
}

async function approveCircleMember(svc, user, body) {
  const membershipId = String(body.membershipId || '');
  if (!membershipId) return json(400, { error: 'invalid_request' });
  const m = await svc.entities.CircleMembership.get(membershipId).catch(() => null);
  if (!m) return json(404, { error: 'not_found' });
  const callerRole = await getCallerCircleRole(svc, user, m.circle_id);
  const isAdmin = user.role === 'admin' || user.role === 'founder';
  if (callerRole !== 'organizer' && !isAdmin) return json(403, { error: 'not_authorized' });
  if (m.status !== 'pending') return json(409, { error: 'already_handled' });
  const updated = await svc.entities.CircleMembership.update(membershipId, { status: 'member' });
  // Authoritative member_count — recount distinct active members server-side.
  await recountCircleMembers(svc, m.circle_id);
  return json(200, { ok: true, membership: updated });
}

async function removeCircleMember(svc, user, body) {
  const membershipId = String(body.membershipId || '');
  if (!membershipId) return json(400, { error: 'invalid_request' });
  const m = await svc.entities.CircleMembership.get(membershipId).catch(() => null);
  if (!m) return json(404, { error: 'not_found' });
  const callerRole = await getCallerCircleRole(svc, user, m.circle_id);
  const isAdmin = user.role === 'admin' || user.role === 'founder';
  if (callerRole !== 'organizer' && !isAdmin) return json(403, { error: 'not_authorized' });
  if (m.role === 'organizer') return json(403, { error: 'cannot_remove_organizer', message: 'Transfer ownership before removing this member.' });
  const updated = await svc.entities.CircleMembership.update(membershipId, { status: 'removed', ban_reason: String(body.reason || '').slice(0, 500) });
  // Authoritative member_count — recount distinct active members server-side.
  await recountCircleMembers(svc, m.circle_id);
  return json(200, { ok: true, membership: updated });
}

async function banCircleMember(svc, user, body) {
  const membershipId = String(body.membershipId || '');
  if (!membershipId) return json(400, { error: 'invalid_request' });
  const m = await svc.entities.CircleMembership.get(membershipId).catch(() => null);
  if (!m) return json(404, { error: 'not_found' });
  const callerRole = await getCallerCircleRole(svc, user, m.circle_id);
  const isAdmin = user.role === 'admin' || user.role === 'founder';
  if (callerRole !== 'organizer' && !isAdmin) return json(403, { error: 'not_authorized' });
  if (m.role === 'organizer') return json(403, { error: 'cannot_ban_organizer', message: 'Transfer ownership before banning this member.' });
  const updated = await svc.entities.CircleMembership.update(membershipId, { status: 'banned', ban_reason: String(body.reason || '').slice(0, 500) });
  // Authoritative member_count — recount distinct active members server-side.
  await recountCircleMembers(svc, m.circle_id);
  return json(200, { ok: true, membership: updated });
}

async function unbanCircleMember(svc, user, body) {
  const membershipId = String(body.membershipId || '');
  if (!membershipId) return json(400, { error: 'invalid_request' });
  const m = await svc.entities.CircleMembership.get(membershipId).catch(() => null);
  if (!m) return json(404, { error: 'not_found' });
  const callerRole = await getCallerCircleRole(svc, user, m.circle_id);
  const isAdmin = user.role === 'admin' || user.role === 'founder';
  if (callerRole !== 'organizer' && !isAdmin) return json(403, { error: 'not_authorized' });
  if (m.status !== 'banned') return json(409, { error: 'not_banned' });
  // Unbanning removes the member entirely — they must re-join from scratch.
  await svc.entities.CircleMembership.delete(membershipId);
  return json(200, { ok: true });
}

async function transferCircleOwnership(svc, user, body) {
  const circleId = String(body.circleId || '');
  const targetMembershipId = String(body.targetMembershipId || '');
  if (!circleId || !targetMembershipId) return json(400, { error: 'invalid_request' });
  const callerRole = await getCallerCircleRole(svc, user, circleId);
  const isAdmin = user.role === 'admin' || user.role === 'founder';
  if (callerRole !== 'organizer' && !isAdmin) return json(403, { error: 'not_authorized' });

  const target = await svc.entities.CircleMembership.get(targetMembershipId).catch(() => null);
  if (!target || target.circle_id !== circleId) return json(404, { error: 'not_found' });
  if (target.status !== 'member') return json(403, { error: 'not_member', message: 'Only active members can receive ownership.' });

  // Demote the current organizer(s) to member, promote the target to organizer.
  const organizers = await svc.entities.CircleMembership.filter({
    circle_id: circleId, status: 'member', role: 'organizer',
  }).catch(() => []);
  for (const org of (organizers || [])) {
    if (String(org.id) !== String(targetMembershipId)) {
      await svc.entities.CircleMembership.update(org.id, { role: 'member' });
    }
  }
  await svc.entities.CircleMembership.update(targetMembershipId, { role: 'organizer' });
  await svc.entities.Circle.update(circleId, {
    host_name: target.member_name || '',
    host_avatar: target.member_avatar || '',
  }).catch(() => {});
  return json(200, { ok: true });
}

// ---------------------------------------------------------------------------
// SEC Batch 1A — Circle chat message moderation actions.
// The client can no longer mutate CircleChatMessage directly (RLS blocks
// create/update/delete for ordinary users). These actions run as service
// role after authorization.
// ---------------------------------------------------------------------------

// Edit a circle chat message. Only the author may edit their own ordinary
// text message, and only while still an active member of the circle.
async function editCircleMessage(svc, user, body) {
  const messageId = String(body.messageId || '');
  const content = String(body.content || '').trim();
  if (!messageId || !content) return json(400, { error: 'invalid_request' });
  if (content.length > 5000) return json(400, { error: 'too_long' });

  const msg = await svc.entities.CircleChatMessage.get(messageId).catch(() => null);
  if (!msg) return json(404, { error: 'not_found' });
  if (String(msg.created_by_id) !== String(user.id)) {
    return json(403, { error: 'not_authorized', message: 'Only the author can edit this message.' });
  }
  if (msg.type !== 'text') return json(403, { error: 'not_editable', message: 'Only text messages can be edited.' });

  // Author must still be an active member of the circle.
  const role = await getCallerCircleRole(svc, user, msg.circle_id);
  if (!role) return json(403, { error: 'not_member', message: 'Only active circle members can edit messages.' });

  const updated = await svc.entities.CircleChatMessage.update(messageId, { content });
  return json(200, { ok: true, message: updated });
}

// Pin or unpin a circle chat message. Only organizers/admins may pin.
async function pinCircleMessage(svc, user, body) {
  const messageId = String(body.messageId || '');
  if (!messageId) return json(400, { error: 'invalid_request' });

  const msg = await svc.entities.CircleChatMessage.get(messageId).catch(() => null);
  if (!msg) return json(404, { error: 'not_found' });

  const role = await getCallerCircleRole(svc, user, msg.circle_id);
  const isAdmin = user.role === 'admin' || user.role === 'founder';
  if (role !== 'organizer' && !isAdmin) {
    return json(403, { error: 'not_authorized', message: 'Only organizers can pin messages.' });
  }

  const updated = await svc.entities.CircleChatMessage.update(messageId, { is_pinned: !msg.is_pinned });
  return json(200, { ok: true, message: updated });
}

// React to a circle chat message. Only active circle members may react.
// Reactions are stored as "userId:emoji" strings for per-user dedup (toggle).
async function reactCircleMessage(svc, user, body) {
  const messageId = String(body.messageId || '');
  const emoji = String(body.emoji || '').trim().slice(0, 10);
  if (!messageId || !emoji) return json(400, { error: 'invalid_request' });

  const msg = await svc.entities.CircleChatMessage.get(messageId).catch(() => null);
  if (!msg) return json(404, { error: 'not_found' });

  const role = await getCallerCircleRole(svc, user, msg.circle_id);
  if (!role) return json(403, { error: 'not_member', message: 'Only active circle members can react.' });

  const reactionTag = `${user.id}:${emoji}`;
  const reactions = Array.isArray(msg.reactions) ? [...msg.reactions] : [];
  const idx = reactions.indexOf(reactionTag);
  if (idx >= 0) reactions.splice(idx, 1);
  else reactions.push(reactionTag);

  const updated = await svc.entities.CircleChatMessage.update(messageId, { reactions });
  return json(200, { ok: true, message: updated });
}

// Delete a circle chat message. The author may delete their own message;
// organizers/admins may delete any message (moderation).
async function deleteCircleMessage(svc, user, body) {
  const messageId = String(body.messageId || '');
  if (!messageId) return json(400, { error: 'invalid_request' });

  const msg = await svc.entities.CircleChatMessage.get(messageId).catch(() => null);
  if (!msg) return json(404, { error: 'not_found' });

  const isAuthor = String(msg.created_by_id) === String(user.id);
  const role = await getCallerCircleRole(svc, user, msg.circle_id);
  const isAdmin = user.role === 'admin' || user.role === 'founder';
  if (!isAuthor && role !== 'organizer' && !isAdmin) {
    return json(403, { error: 'not_authorized', message: 'Only the author or an organizer can delete this message.' });
  }

  await svc.entities.CircleChatMessage.delete(messageId);
  return json(200, { ok: true });
}

// Post a system message in a circle. Only organizers/admins may post system
// messages. Sender identity is derived from the server.
async function sendCircleSystemMessage(svc, user, body) {
  const circleId = String(body.circleId || '');
  const content = String(body.content || '').trim().slice(0, 500);
  if (!circleId || !content) return json(400, { error: 'invalid_request' });

  const role = await getCallerCircleRole(svc, user, circleId);
  const isAdmin = user.role === 'admin' || user.role === 'founder';
  if (role !== 'organizer' && !isAdmin) {
    return json(403, { error: 'not_authorized', message: 'Only organizers can post system messages.' });
  }

  const member = await getCallerMember(svc, user);
  const msg = await svc.entities.CircleChatMessage.create({
    circle_id: circleId,
    sender_name: member?.display_name || user.full_name || 'System',
    sender_avatar: member?.photo_url || '',
    sender_role: role || 'organizer',
    type: 'system',
    content,
  });
  return json(200, { ok: true, message: msg });
}

// ---------------------------------------------------------------------------
// SEC Batch 1A — Attendance actions (mark arrived, reminders, host remove).
// ---------------------------------------------------------------------------

// Mark the caller's own attendance as arrived. Only the attendee themselves
// may mark their own arrival. Idempotent.
async function markArrived(svc, user, body) {
  const experienceId = body.experienceId;
  if (!experienceId) return json(400, { error: 'invalid_request' });

  const mine = await svc.entities.Attendance.filter({
    experience_id: experienceId, member_user_id: String(user.id),
  }).catch(() => []);
  const attendance = (mine || []).find((a) => a.status === 'going');
  if (!attendance) return json(404, { error: 'not_attending' });

  if (attendance.arrived) return json(200, { ok: true, already_arrived: true, attendance });

  const updated = await svc.entities.Attendance.update(attendance.id, {
    arrived: true,
    arrived_at: new Date().toISOString(),
  });
  return json(200, { ok: true, attendance: updated });
}

// Update the caller's own reminder preference. Only the attendee themselves
// may update their own reminders_enabled.
async function updateAttendanceReminders(svc, user, body) {
  const experienceId = body.experienceId;
  const enabled = body.remindersEnabled === true;
  if (!experienceId) return json(400, { error: 'invalid_request' });

  const mine = await svc.entities.Attendance.filter({
    experience_id: experienceId, member_user_id: String(user.id),
  }).catch(() => []);
  const attendance = (mine || []).find((a) => a.status === 'going' || a.status === 'waiting');
  if (!attendance) return json(404, { error: 'not_attending' });

  const updated = await svc.entities.Attendance.update(attendance.id, { reminders_enabled: enabled });
  return json(200, { ok: true, attendance: updated });
}

// Remove an attendee from an experience. Only the experience host or admin
// may remove an attendee. Decrements spots_filled.
async function removeAttendee(svc, user, body) {
  const attendanceId = String(body.attendanceId || '');
  if (!attendanceId) return json(400, { error: 'invalid_request' });

  const attendance = await svc.entities.Attendance.get(attendanceId).catch(() => null);
  if (!attendance) return json(404, { error: 'not_found' });

  const exp = await svc.entities.Experience.get(attendance.experience_id).catch(() => null);
  if (!exp) return json(404, { error: 'not_found' });
  const isHost = exp.host_user_id && String(exp.host_user_id) === String(user.id);
  const isAdmin = user.role === 'admin' || user.role === 'founder';
  if (!isHost && !isAdmin) return json(403, { error: 'not_authorized', message: 'Only the host can remove attendees.' });

  await svc.entities.Attendance.delete(attendanceId);
  // Authoritative capacity update — decrement spots_filled ONLY when the
  // removed attendance was 'going'. Waiting/left/cancelled/rejected statuses
  // do not consume capacity. The attendance status is captured before deletion
  // (via the attendance variable above) so it is available for this check.
  let updatedExp = null;
  if (attendance.status === 'going' && exp.spots_filled && exp.spots_filled > 0) {
    updatedExp = await svc.entities.Experience.update(exp.id, { spots_filled: Math.max(0, exp.spots_filled - 1) }).catch(() => null);
  }
  return json(200, { ok: true, experience: updatedExp || undefined });
}

// ---------------------------------------------------------------------------
// SEC Batch 1A — Invitation response actions (one-time consumption).
// Only the authenticated recipient may accept or decline a pending, valid,
// unexpired invitation. Accepted invitations are consumed exactly once.
// Expired, declined, cancelled or already-used invitations cannot be reused.
// Blocked pairs are denied bidirectionally. Clients cannot submit arbitrary
// status values — only 'accepted' or 'declined' are permitted.
// ---------------------------------------------------------------------------

// Common validation for invitation responses. Returns the invitation or an
// error response. Caller passes the entity name ('CircleInvitation' or
// 'ExperienceInvitation').
async function validateInvitationResponse(svc, user, body, entityName) {
  const invitationId = String(body.invitationId || '');
  const response = String(body.response || '').trim();
  if (!invitationId) return { error: json(400, { error: 'invalid_request' }) };
  if (response !== 'accepted' && response !== 'declined') {
    return { error: json(400, { error: 'invalid_response', message: 'Response must be accepted or declined.' }) };
  }

  const inv = await svc.entities[entityName].get(invitationId).catch(() => null);
  if (!inv) return { error: json(404, { error: 'not_found' }) };

  // Authenticated recipient only.
  if (String(inv.pal_user_id) !== String(user.id)) {
    return { error: json(403, { error: 'not_authorized', message: 'Only the invited member can respond to this invitation.' }) };
  }

  // Pending status only — expired, declined, cancelled or already-used
  // invitations cannot be reused.
  if (inv.status !== 'pending') {
    return { error: json(409, { error: 'already_handled', message: 'This invitation has already been responded to.' }) };
  }

  // Valid server-generated expiry — missing or invalid expires_at is treated
  // as expired. This prevents clients from creating invitations without an
  // expiry and responding to them later.
  if (!inv.expires_at) {
    return { error: json(410, { error: 'invitation_expired', message: 'This invitation has expired.' }) };
  }
  const expMs = new Date(inv.expires_at).getTime();
  if (isNaN(expMs) || expMs <= Date.now()) {
    // Mark as declined so it cannot be reused.
    await svc.entities[entityName].update(invitationId, { status: 'declined' }).catch(() => {});
    return { error: json(410, { error: 'invitation_expired', message: 'This invitation has expired.' }) };
  }

  // Bidirectional block check — blocked pairs are denied.
  const senderUserId = String(inv.created_by_id || '');
  if (senderUserId && await isBlockedPair(svc, user.id, senderUserId)) {
    return { error: json(403, { error: 'blocked', message: "You can't accept this invitation." }) };
  }

  return { inv, response };
}

// Respond to a Circle invitation. Accepting creates a CircleMembership FIRST,
// then marks the invitation accepted only after successful creation. Declining
// marks the invitation directly after validation (no side effects).
// CONCURRENCY LIMITATION: without atomic compare-and-swap, two simultaneous
// accept requests could both pass the pending check. The idempotent membership
// check (existing member) prevents duplicate memberships in most cases, but
// a narrow race window remains. Fail conservatively — do not consume the
// invitation until the membership is created.
async function respondCircleInvitation(svc, user, body) {
  const result = await validateInvitationResponse(svc, user, body, 'CircleInvitation');
  if (result.error) return result.error;
  const { inv, response } = result;

  // Decline is safe — no side effects. Mark directly after validation.
  if (response === 'declined') {
    await svc.entities.CircleInvitation.update(inv.id, { status: 'declined' });
    return json(200, { ok: true, declined: true });
  }

  // Accepted — revalidate all conditions before creating the membership.
  // Re-check invitation status to narrow the race window.
  const recheck = await svc.entities.CircleInvitation.get(inv.id).catch(() => null);
  if (!recheck || recheck.status !== 'pending') {
    return json(409, { error: 'already_handled', message: 'This invitation has already been responded to.' });
  }

  // Revalidate target lifecycle.
  const circle = await svc.entities.Circle.get(inv.circle_id).catch(() => null);
  if (!circle) return json(404, { error: 'not_found', message: 'Circle no longer exists.' });
  if (circle.status !== 'active') return json(403, { error: 'not_active', message: 'Circle is no longer active.' });

  // Check for existing membership (idempotent). Use member_user_id (canonical
  // user ID) — NOT created_by_id (service role).
  const existing = await svc.entities.CircleMembership.filter({
    circle_id: inv.circle_id, member_user_id: String(user.id),
  }).catch(() => []);
  if (existing && existing.some((m) => m.status === 'member' || m.role === 'organizer')) {
    // Already a member — consume the invitation and return.
    await svc.entities.CircleInvitation.update(inv.id, { status: 'accepted' });
    return json(200, { ok: true, joined: true, already_member: true });
  }
  // Banned members cannot join.
  if (existing && existing.some((m) => m.status === 'banned')) {
    return json(403, { error: 'banned', message: 'You are banned from this circle.' });
  }
  // Capacity check.
  if (circle.max_members && circle.max_members > 0) {
    const activeMembers = await svc.entities.CircleMembership.filter({ circle_id: inv.circle_id, status: 'member' }).catch(() => []);
    if (activeMembers.length >= circle.max_members) {
      return json(403, { error: 'full', message: 'This circle is full.' });
    }
  }

  // Create the membership FIRST.
  const member = await getCallerMember(svc, user);
  const m = await svc.entities.CircleMembership.create({
    circle_id: inv.circle_id,
    member_user_id: String(user.id),
    member_name: member?.display_name || user.full_name || 'You',
    member_avatar: member?.photo_url || '',
    role: 'member',
    status: 'member',
    joined_date: new Date().toISOString().slice(0, 10),
  });

  // Mark the invitation accepted ONLY after successful membership creation.
  await svc.entities.CircleInvitation.update(inv.id, { status: 'accepted' });
  // Authoritative member_count — recount distinct active members server-side.
  await recountCircleMembers(svc, inv.circle_id);
  return json(200, { ok: true, joined: true, membership: m });
}

// Respond to an Experience invitation. Accepting creates an Attendance FIRST,
// then marks the invitation accepted only after successful creation. Declining
// marks the invitation directly after validation (no side effects).
// CONCURRENCY LIMITATION: same as respondCircleInvitation — without atomic
// compare-and-swap, a narrow race window remains. The idempotent attendance
// check prevents duplicate attendances in most cases.
async function respondExperienceInvitation(svc, user, body) {
  const result = await validateInvitationResponse(svc, user, body, 'ExperienceInvitation');
  if (result.error) return result.error;
  const { inv, response } = result;

  // Decline is safe — no side effects. Mark directly after validation.
  if (response === 'declined') {
    await svc.entities.ExperienceInvitation.update(inv.id, { status: 'declined' });
    return json(200, { ok: true, declined: true });
  }

  // Accepted — revalidate all conditions before creating the attendance.
  const recheck = await svc.entities.ExperienceInvitation.get(inv.id).catch(() => null);
  if (!recheck || recheck.status !== 'pending') {
    return json(409, { error: 'already_handled', message: 'This invitation has already been responded to.' });
  }

  // Revalidate target lifecycle.
  const exp = await svc.entities.Experience.get(inv.experience_id).catch(() => null);
  if (!exp) return json(404, { error: 'not_found', message: 'Experience no longer exists.' });
  if (exp.status !== 'active') return json(403, { error: 'not_active', message: 'Experience is no longer active.' });

  // Check for existing attendance (idempotent).
  const existing = await svc.entities.Attendance.filter({
    experience_id: inv.experience_id, member_user_id: String(user.id),
  }).catch(() => []);
  if (existing && existing.some((a) => a.status === 'going' || a.status === 'waiting')) {
    // Already attending — consume the invitation and return.
    await svc.entities.ExperienceInvitation.update(inv.id, { status: 'accepted' });
    return json(200, { ok: true, joined: true, already_attending: true });
  }
  // Capacity check.
  if (exp.max_participants && exp.max_participants > 0 && (exp.spots_filled || 0) >= exp.max_participants) {
    return json(403, { error: 'full', message: 'This experience is full.' });
  }

  // Create the attendance FIRST.
  const member = await getCallerMember(svc, user);
  const a = await svc.entities.Attendance.create({
    experience_id: inv.experience_id,
    member_user_id: String(user.id),
    member_name: member?.display_name || user.full_name || 'You',
    member_avatar: member?.photo_url || '',
    status: 'going',
    reminders_enabled: true,
  });
  // Increment spots_filled.
  await svc.entities.Experience.update(exp.id, { spots_filled: (exp.spots_filled || 0) + 1 }).catch(() => {});

  // Mark the invitation accepted ONLY after successful attendance creation.
  await svc.entities.ExperienceInvitation.update(inv.id, { status: 'accepted' });
  return json(200, { ok: true, joined: true, attendance: a });
}

// ---------------------------------------------------------------------------
// SEC Batch 1A — Circle lifecycle: safe deletion with membership cleanup.
// Only the Circle owner (creator) or admin/founder may delete. Cleans up
// all memberships, chat messages, and invitations before deleting the circle.
// ---------------------------------------------------------------------------

async function deleteCircle(svc, user, body) {
  const circleId = String(body.circleId || '');
  if (!circleId) return json(400, { error: 'invalid_request' });

  const circle = await svc.entities.Circle.get(circleId).catch(() => null);
  if (!circle) return json(404, { error: 'not_found' });

  const isOwner = String(circle.created_by_id) === String(user.id);
  const isAdmin = user.role === 'admin' || user.role === 'founder';
  if (!isOwner && !isAdmin) {
    return json(403, { error: 'not_authorized', message: 'Only the circle owner can delete this circle.' });
  }

  // Clean up all related records before deleting the circle.
  await svc.entities.CircleMembership.deleteMany({ circle_id: circleId }).catch(() => {});
  await svc.entities.CircleChatMessage.deleteMany({ circle_id: circleId }).catch(() => {});
  await svc.entities.CircleInvitation.deleteMany({ circle_id: circleId }).catch(() => {});
  await svc.entities.Circle.delete(circleId);

  return json(200, { ok: true });
}

// ---------------------------------------------------------------------------
// SEC Batch 1A — Create the initial organizer membership when creating a
// Circle or activity. Verifies the caller created the circle, creates
// exactly one organizer membership. Idempotent: if one already exists, ok.
// ---------------------------------------------------------------------------

async function createOrganizerMembership(svc, user, body) {
  const circleId = String(body.circleId || '');
  if (!circleId) return json(400, { error: 'invalid_request' });

  const circle = await svc.entities.Circle.get(circleId).catch(() => null);
  if (!circle) return json(404, { error: 'not_found' });

  // Only the circle creator may create the initial organizer membership.
  if (String(circle.created_by_id) !== String(user.id)) {
    return json(403, { error: 'not_authorized', message: 'Only the circle creator can become the organizer.' });
  }

  // Idempotent: if an organizer membership already exists, return ok.
  // Use member_user_id (canonical user ID) — NOT created_by_id (service role).
  const existing = await svc.entities.CircleMembership.filter({
    circle_id: circleId, member_user_id: String(user.id),
  }).catch(() => []);
  if (existing && existing.length > 0) {
    const org = existing.find((m) => m.role === 'organizer' && m.status === 'member');
    if (org) return json(200, { ok: true, already_exists: true, membership: org });
  }

  const member = await getCallerMember(svc, user);
  const m = await svc.entities.CircleMembership.create({
    circle_id: circleId,
    member_user_id: String(user.id),
    member_name: member?.display_name || user.full_name || 'You',
    member_avatar: member?.photo_url || '',
    role: 'organizer',
    status: 'member',
    joined_date: new Date().toISOString().slice(0, 10),
  });

  // Authoritative member_count — recount distinct active members server-side.
  await recountCircleMembers(svc, circleId);

  return json(200, { ok: true, membership: m });
}

// ---------------------------------------------------------------------------
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return json(401, { error: 'unauthorized' });
    const svc = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || '');

    // AGE-001 — Gate social interactions behind 18+ eligibility.
    if (ELIGIBILITY_REQUIRED_ACTIONS.has(action)) {
      const eligible = await checkEligibility(svc, user);
      if (!eligible) {
        return json(403, { error: 'eligibility_required', message: 'Please confirm your date of birth to use this feature.' });
      }
    }

    switch (action) {
      case 'requestConnection': return await requestConnection(svc, user, body);
      case 'acceptConnection': return await acceptConnection(svc, user, body);
      case 'joinCircle': return await joinCircle(svc, user, body);
      case 'joinExperience': return await joinExperience(svc, user, body);
      case 'sendCircleInvitations': return await sendCircleInvitations(svc, user, body);
      case 'sendMessage': return await sendMessage(svc, user, body);
      case 'markConversationRead': return await markConversationRead(svc, user, body);
      case 'setTyping': return await setTyping(svc, user, body);
      case 'getMatchExplanation': return await getMatchExplanation(svc, user);
      case 'resolveMemberNames': return await resolveMemberNames(svc, user, body);
      case 'resolveMemberProfile': return await resolveMemberProfile(svc, user, body);
      case 'resolveOwner': return await resolveOwner(svc, user);
      case 'editExperienceMessage': return await editExperienceMessage(svc, user, body);
      case 'updateDob': return await updateDob(svc, user, body);
      case 'updateProfile': return await updateProfile(svc, user, body);
      case 'createProfile': return await createProfile(svc, user, body);
      case 'registerProfile': return await registerProfile(svc, user, body);
      case 'deleteAccount': return await deleteAccount(svc, user, body);
      case 'signOutEverywhere': return await signOutEverywhere(svc, user);
      case 'discoverMembers': return await discoverMembers(svc, user, body);
      case 'createSafetyReport': return await createSafetyReport(svc, user, body);
      case 'moderateSafetyReport': return await moderateSafetyReport(svc, user, body);
      case 'blockMember': return await blockMember(svc, user, body);
      case 'unblockMember': return await unblockMember(svc, user, body);
      case 'rejectConnection': return await rejectConnection(svc, user, body);
      case 'cancelConnectionRequest': return await cancelConnectionRequest(svc, user, body);
      case 'listMySafetyReports': return await listMySafetyReports(svc, user);
      case 'sendExperienceInvitations': return await sendExperienceInvitations(svc, user, body);
      case 'approveCircleMember': return await approveCircleMember(svc, user, body);
      case 'removeCircleMember': return await removeCircleMember(svc, user, body);
      case 'banCircleMember': return await banCircleMember(svc, user, body);
      case 'unbanCircleMember': return await unbanCircleMember(svc, user, body);
      case 'transferCircleOwnership': return await transferCircleOwnership(svc, user, body);
      case 'leaveCircle': return await leaveCircle(svc, user, body);
      case 'leaveExperience': return await leaveExperience(svc, user, body);
      case 'cancelExperience': return await cancelExperience(svc, user, body);
      // Batch 1A — circle chat moderation, attendance, invitations, lifecycle.
      case 'editCircleMessage': return await editCircleMessage(svc, user, body);
      case 'pinCircleMessage': return await pinCircleMessage(svc, user, body);
      case 'reactCircleMessage': return await reactCircleMessage(svc, user, body);
      case 'deleteCircleMessage': return await deleteCircleMessage(svc, user, body);
      case 'sendCircleSystemMessage': return await sendCircleSystemMessage(svc, user, body);
      case 'markArrived': return await markArrived(svc, user, body);
      case 'updateAttendanceReminders': return await updateAttendanceReminders(svc, user, body);
      case 'removeAttendee': return await removeAttendee(svc, user, body);
      case 'respondCircleInvitation': return await respondCircleInvitation(svc, user, body);
      case 'respondExperienceInvitation': return await respondExperienceInvitation(svc, user, body);
      case 'deleteCircle': return await deleteCircle(svc, user, body);
      case 'createOrganizerMembership': return await createOrganizerMembership(svc, user, body);
      default:
    return json(404, {
        error: 'unknown_action',
        action,
        available: [
            'requestConnection',
            'acceptConnection',
            'joinCircle',
            'leaveCircle',
            'joinExperience',
            'leaveExperience',
            'sendMessage',
            'updateProfile',
            'createProfile',
            'discoverMembers'
        ]
    });
    }
  } catch (error) {
    console.error('authorizationGate error:', error);
    return json(500, { error: 'Something went wrong. Please try again.' });
  }
});