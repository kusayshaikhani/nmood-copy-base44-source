// Member Safety & Account Management — account-state service.
// Powers Pause / Hide / Reactivate / Delete with side effects, plus helpers
// for discovery and Pal-request gating. Distinct from admin_status (admin
// moderation): account_state is user-initiated and reversible.

import { base44 } from '@/api/base44Client';
import { updateMemberProfile } from '@/lib/member-update';

export const ACCOUNT_STATES = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  HIDDEN: 'hidden',
  DELETED: 'deleted',
};

// Configurable soft-delete recovery window (days). After it elapses the
// retention job permanently purges the record. Logged-out users recover via
// support/admin within this window.
export const RECOVERY_WINDOW_DAYS = 30;

export const STATE_LABELS = {
  active: 'Active',
  paused: 'Paused',
  hidden: 'Hidden',
  deleted: 'Deleted',
};

// Discovery gate: only fully active, non-moderated members are discoverable.
export function isDiscoverable(member) {
  if (!member) return false;
  const state = member.account_state || ACCOUNT_STATES.ACTIVE;
  if (state !== ACCOUNT_STATES.ACTIVE) return false;
  if ((member.admin_status || 'active') !== 'active') return false;
  return true;
}

// Paused members cannot receive NEW Pal requests (existing chats remain).
// Hidden members can still be reached by existing connections.
export function canReceiveNewPalRequest(member) {
  if (!member) return false;
  const state = member.account_state || ACCOUNT_STATES.ACTIVE;
  if (state === ACCOUNT_STATES.PAUSED || state === ACCOUNT_STATES.DELETED) return false;
  if ((member.admin_status || 'active') !== 'active') return false;
  return true;
}

// PalRequest cleanup is handled exclusively by the trusted deleteAccount
// backend action (authorizationGate). The client no longer performs direct
// PalRequest mutations — RLS blocks client-side updateMany for ordinary users.

async function logAction(action, member, details) {
  try {
    await base44.entities.AuditLog.create({
      action,
      administrator: String(member.created_by_id || ''),
      target_type: 'Member',
      target_id: member.id,
      details,
    });
  } catch { /* audit must never block */ }
}

// Pause — remove from recommendations & search, prevent new Pal requests,
// existing chats remain available. Snapshots profile_visibility to restore later.
// SEC — pause runs through the trusted pauseAccount backend action. The backend
// authenticates the owner, cancels pending PalRequests in both directions, derives
// timestamps/identity server-side, and is idempotent. The client no longer performs
// direct Member or PalRequest mutations for pause.
export async function pauseProfile(member) {
  if (!member?.id) throw new Error('No member record found.');
  try {
    const resp = await base44.functions.invoke('accountState', { action: 'pauseAccount' });
    const res = resp?.data || resp;
    if (!res?.ok) throw new Error(res?.message || 'Could not pause account.');
    return { ok: true };
  } catch (e) {
    throw new Error(e?.message || 'Could not pause account.');
  }
}

// Hide — hide from discovery, existing Pals can still communicate.
export async function hideProfile(member) {
  if (!member?.id) throw new Error('No member record found.');
  const patch = {
    account_state: ACCOUNT_STATES.HIDDEN,
    hidden_at: new Date().toISOString(),
  };
  if (member.account_state === ACCOUNT_STATES.ACTIVE && member.profile_visibility !== 'private') {
    patch.previous_profile_visibility = member.profile_visibility || 'connections';
    patch.profile_visibility = 'private';
  }
  await updateMemberProfile(patch);
  await logAction('account_hidden', member, 'Profile hidden from discovery. Existing connections preserved.');
  return { ok: true };
}

// Reactivate — restore an active profile from Paused or Hidden.
export async function reactivateProfile(member) {
  if (!member?.id) throw new Error('No member record found.');
  const patch = {
    account_state: ACCOUNT_STATES.ACTIVE,
    paused_at: null,
    hidden_at: null,
  };
  if (member.previous_profile_visibility) {
    patch.profile_visibility = member.previous_profile_visibility;
    patch.previous_profile_visibility = null;
  }
  await updateMemberProfile(patch);
  await logAction('account_reactivated', member, 'Profile reactivated by member.');
  return { ok: true };
}

// Soft delete with a recovery window. Disables login (force_logout), cancels
// pending Pal requests, preserves data + audit logs for recovery. Does NOT
// anonymize immediately (unlike the permanent purge path).
export async function requestAccountDeletion(member, user, password) {
  if (!member?.id) throw new Error('No member record found.');

  // Re-authenticate email accounts for extra confirmation safety.
  if (password && user?.email) {
    try {
      await base44.auth.loginViaEmailPassword(user.email, password);
    } catch {
      throw new Error('Password verification failed. Please check your password and try again.');
    }
  }

  const now = new Date();
  const recoveryExpires = new Date(now.getTime() + RECOVERY_WINDOW_DAYS * 86400000).toISOString();

  await updateMemberProfile({
    account_state: ACCOUNT_STATES.DELETED,
    deleted_at: now.toISOString(),
    recovery_expires_at: recoveryExpires,
    force_logout_at: now.toISOString(),
    profile_visibility: 'private',
    who_can_message: 'no_one',
  });

  const userId = String(member.created_by_id || '');

  try {
    await base44.entities.AuditLog.create({
      action: 'account_soft_deleted',
      administrator: user?.email || userId,
      target_type: 'Member',
      target_id: member.id,
      details: `Self-initiated soft delete. Login disabled. Recovery possible until ${recoveryExpires}. Data preserved. Pending Pal requests are cancelled by the deleteAccount backend action.`,
    });
  } catch { /* non-blocking */ }

  return { ok: true, recovery_expires_at: recoveryExpires };
}

// Restore a soft-deleted account within its recovery window (support/admin path).
export async function recoverAccount(member) {
  if (!member?.id) throw new Error('No member record found.');
  const exp = member.recovery_expires_at ? new Date(member.recovery_expires_at).getTime() : 0;
  if (exp && Date.now() > exp) throw new Error('Recovery window has expired.');
  await updateMemberProfile({
    account_state: ACCOUNT_STATES.ACTIVE,
    deleted_at: null,
    recovery_expires_at: null,
    force_logout_at: null,
    profile_visibility: member.previous_profile_visibility || 'connections',
    who_can_message: 'connections',
  });
  await logAction('account_recovered', member, 'Account recovered within the deletion recovery window.');
  return { ok: true };
}