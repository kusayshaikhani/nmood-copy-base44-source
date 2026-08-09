// SEC Batch 1C — Trusted account pause action.
// Authenticates the account owner, updates only the caller's canonical Member,
// cancels pending PalRequests in both directions, removes the paused account
// from discovery (profile_visibility=private), preserves recoverable data,
// derives timestamps and actor identity server-side, and is idempotent.
// Prevents one user from pausing another user's account.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { json, getMember } from '../../shared/concierge-utils.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return json(401, { error: 'unauthorized' });
    const svc = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const action = body.action;

    if (action === 'pauseAccount') {
      // Resolve the caller's canonical Member record (prefers onboarded, earliest).
      const member = await getMember(svc, String(user.id));
      if (!member) return json(404, { error: 'not_found', message: 'Member record not found.' });

      // Idempotent: if already paused, return ok without side effects.
      if (member.account_state === 'paused') {
        return json(200, { ok: true, already_paused: true });
      }

      // Only active or hidden accounts can be paused.
      if (member.account_state === 'deleted') {
        return json(403, { error: 'deleted', message: 'Cannot pause a deleted account.' });
      }

      const now = new Date().toISOString();
      const patch: any = {
        account_state: 'paused',
        paused_at: now,
      };

      // Snapshot profile_visibility to restore on reactivation.
      if (member.account_state === 'active' && member.profile_visibility !== 'private') {
        patch.previous_profile_visibility = member.profile_visibility || 'connections';
        patch.profile_visibility = 'private';
      }

      // Update the caller's Member record (asServiceRole bypasses RLS).
      await svc.entities.Member.update(member.id, patch);

      // Cancel pending PalRequests in both directions (sender and receiver).
      // This removes the paused account from the Pal request queue.
      try {
        await svc.entities.PalRequest.updateMany(
          { status: 'pending', sender_user_id: String(user.id) },
          { $set: { status: 'cancelled' } }
        ).catch(() => {});
        await svc.entities.PalRequest.updateMany(
          { status: 'pending', receiver_user_id: String(user.id) },
          { $set: { status: 'cancelled' } }
        ).catch(() => {});
      } catch { /* non-blocking */ }

      // Audit log — actor identity derived server-side from the session.
      try {
        await svc.entities.AuditLog.create({
          action: 'account_paused',
          administrator: user.email || String(user.id),
          target_type: 'Member',
          target_id: member.id,
          details: 'Profile paused by member. Removed from discovery. Pending Pal requests cancelled.',
        });
      } catch { /* non-blocking */ }

      return json(200, { ok: true });
    }

    return json(400, { error: 'unknown_action' });
  } catch (error) {
    console.error('accountState error:', error);
    return json(500, { error: 'Something went wrong. Please try again.' });
  }
});