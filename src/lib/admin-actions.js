import { base44 } from '@/api/base44Client';
import { toast } from '@/components/ui/use-toast';

/**
 * All privileged admin mutations go through the adminConsole backend function,
 * which verifies the caller's admin role server-side and uses service-role to
 * write across all records. Frontend SDK calls cannot update other users' rows.
 */
// functions.invoke resolves to { data: <body> }; list modes return body { data: items }.
// Normalize so callers always receive an array regardless of wrapping shape.
const extractList = (r) => {
  const d = r?.data;
  if (Array.isArray(d)) return d;
  if (d && Array.isArray(d.data)) return d.data;
  return [];
};

async function adminUpdate(entity, id, patch, reason) {
  const res = await base44.functions.invoke('adminConsole', {
    mode: 'update',
    entity,
    id,
    patch,
    reason,
  });
  return res?.data?.result;
}

async function adminBroadcast(announcement) {
  const res = await base44.functions.invoke('adminConsole', {
    mode: 'broadcast',
    announcement,
  });
  return res?.data?.reach ?? 0;
}

/* ---------- Members ---------- */
export const setMemberStatus = (id, status, note) =>
  adminUpdate('Member', id, note !== undefined ? { admin_status: status, admin_note: note } : { admin_status: status });

/* ---------- FM-003 Member Management Center ---------- */
export const updateMember = (id, patch, reason) => adminUpdate('Member', id, patch, reason);

export const membershipAction = (userId, action, reason) =>
  base44.functions.invoke('adminConsole', { mode: 'membershipAction', userId, action, reason });

// PB-002 — Founder override: grants/revokes Premium through the membershipOverride
// backend function, which records full audit (previous_value, new_value, source,
// granted_by) and bypasses payment (billing_platform = 'admin').
export const membershipOverrideAction = (userId, action, opts = {}) =>
  base44.functions.invoke('membershipOverride', {
    target_user_id: userId,
    action: action === 'upgrade' ? 'set_premium' : 'set_explorer',
    permanent: opts.permanent !== false,
    expires_at: opts.expiresAt,
    reason: opts.reason,
  });

/* PB-007 — Force Logout: invalidates all sessions for a member. */
export const forceLogoutAction = (memberId, reason) =>
  base44.functions.invoke('forceLogout', { member_id: memberId, reason });

export const memberStats = (userId) =>
  base44.functions.invoke('adminConsole', { mode: 'memberStats', userId });

export const listMemberNotes = (memberId) =>
  base44.functions.invoke('adminConsole', { mode: 'listNotes', memberId }).then(extractList);

export const createMemberNote = (memberId, userId, content) =>
  base44.functions.invoke('adminConsole', { mode: 'createNote', memberId, userId, content });

export const updateMemberNote = (noteId, content) =>
  base44.functions.invoke('adminConsole', { mode: 'updateNote', noteId, content });

export const deleteMemberNote = (noteId) =>
  base44.functions.invoke('adminConsole', { mode: 'deleteNote', noteId });

// DEV-001 — Temporary Founder hard delete (development only). The server
// rejects in production and for any non-founder caller.
export const hardDeleteMember = (memberId) =>
  base44.functions.invoke('adminConsole', { mode: 'hardDelete', memberId });

// Production hard delete of any eligible record. Server-side admin/founder
// guard enforced in adminConsole; cascades dependents and writes an audit log.
export const hardDeleteRecord = (entity, id, reason) =>
  base44.functions.invoke('adminConsole', { mode: 'hardDeleteRecord', entity, id, reason });

/* ---------- PB-002 Member History ---------- */
export const memberHistory = (memberId, userId) =>
  base44.functions.invoke('adminConsole', { mode: 'memberHistory', memberId, userId });

/* ---------- Experiences ---------- */
export const setExperienceStatus = (id, patch) => adminUpdate('Experience', id, patch);
export const updateExperience = (id, patch) => adminUpdate('Experience', id, patch);

/* ---------- Circles ---------- */
export const setCircleStatus = (id, patch) => adminUpdate('Circle', id, patch);
export const updateCircle = (id, patch) => adminUpdate('Circle', id, patch);

/* ---------- FM-008 Community Management Center ---------- */
export const listCommunityNotes = (targetType, targetId) =>
  base44.functions.invoke('adminConsole', { mode: 'listCommunityNotes', targetType, targetId }).then(extractList);
export const createCommunityNote = (targetType, targetId, content) =>
  base44.functions.invoke('adminConsole', { mode: 'createCommunityNote', targetType, targetId, content });
export const deleteCommunityNote = (noteId) =>
  base44.functions.invoke('adminConsole', { mode: 'deleteCommunityNote', noteId });
export const listActivity = (targetType, targetId) =>
  base44.functions.invoke('adminConsole', { mode: 'listActivity', targetType, targetId }).then(extractList);

/* ---------- Reports ---------- */
export const setReportStatus = (id, status, note) =>
  adminUpdate('SafetyReport', id, note !== undefined ? { status, resolution_note: note } : { status });

/* ---------- Memberships ---------- */
export const adjustMembership = (id, patch) => adminUpdate('Membership', id, patch);

/* ---------- Support ---------- */
export const setTicketStatus = (id, patch) => adminUpdate('SupportTicket', id, patch);

/* ---------- Announcements ---------- */
export async function createAnnouncementRecord(payload) {
  // Route through the adminConsole backend so the server verifies the
  // caller's admin role — a non-admin cannot create announcements directly.
  const res = await base44.functions.invoke('adminConsole', { mode: 'create', entity: 'Announcement', record: payload });
  return res?.data?.result;
}

export async function sendAnnouncement(announcement) {
  const reach = await adminBroadcast(announcement);
  return reach;
}

/* ---------- helper: action with toast + refresh ---------- */
export function withAction(toastMsg, refresh) {
  return async (fn) => {
    try {
      const result = await fn();
      toast({ title: toastMsg });
      if (refresh) refresh();
      return result;
    } catch (e) {
      toast({ title: 'Action failed', description: e?.message || 'Please try again', variant: 'destructive' });
      throw e;
    }
  };
}