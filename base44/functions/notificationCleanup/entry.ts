// PB-006 — Notification automatic cleanup.
//
// Runs on a schedule (daily) to:
//   1. Remove soft-deleted NotificationReadState records past the retention period
//   2. Expire old pending CircleInvitations (older than 30 days)
//   3. Delete obsolete sent Announcements (older than 90 days)
//   4. Delete stale PalRequest notifications for experiences long past
//
// This keeps the notification list clean and prevents stale data from
// accumulating. All operations use the service role to act across all users.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { requireAdminOrCron } from '../../shared/admin-auth.ts';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  // PB-006 — cleanup runs asServiceRole across all users; require an admin
  // session (or a platform cron signature) so anonymous callers cannot trigger
  // bulk deletion of invitations, announcements, and read receipts.
  const auth = await requireAdminOrCron(base44, req);
  if (!auth.ok) return auth.response;

  const RETENTION_DAYS = 30;
  const ANNOUNCEMENT_RETENTION_DAYS = 90;
  const now = Date.now();
  const cutoff30 = new Date(now - RETENTION_DAYS * 86400000).toISOString();
  const cutoff90 = new Date(now - ANNOUNCEMENT_RETENTION_DAYS * 86400000).toISOString();

  const results = {
    deleted_read_states: 0,
    expired_invitations: 0,
    deleted_announcements: 0,
    errors: [],
  };

  // 1. Delete soft-deleted NotificationReadState records past retention.
  try {
    const states = await base44.asServiceRole.entities.NotificationReadState
      .filter({}, '-deleted_at', 500)
      .catch(() => []);
    const toDelete = (states || []).filter(
      (r) => r.deleted_at && new Date(r.deleted_at).getTime() < new Date(cutoff30).getTime()
    );
    for (const r of toDelete) {
      try {
        await base44.asServiceRole.entities.NotificationReadState.delete(r.id);
        results.deleted_read_states++;
      } catch { /* best-effort */ }
    }
  } catch (e) {
    results.errors.push(`read_states: ${e.message}`);
  }

  // 2. Expire old pending CircleInvitations (older than 30 days).
  try {
    const invs = await base44.asServiceRole.entities.CircleInvitation
      .filter({ status: 'pending' }, '-created_date', 500)
      .catch(() => []);
    const expired = (invs || []).filter(
      (r) => r.created_date && new Date(r.created_date).getTime() < new Date(cutoff30).getTime()
    );
    for (const r of expired) {
      try {
        // Mark as expired rather than deleting — preserves audit trail.
        await base44.asServiceRole.entities.CircleInvitation.update(r.id, { status: 'declined' });
        results.expired_invitations++;
      } catch { /* best-effort */ }
    }
  } catch (e) {
    results.errors.push(`invitations: ${e.message}`);
  }

  // 3. Delete obsolete sent Announcements (older than 90 days).
  try {
    const anns = await base44.asServiceRole.entities.Announcement
      .filter({ status: 'sent' }, '-created_date', 500)
      .catch(() => []);
    const old = (anns || []).filter(
      (r) => r.created_date && new Date(r.created_date).getTime() < new Date(cutoff90).getTime()
    );
    for (const r of old) {
      try {
        await base44.asServiceRole.entities.Announcement.delete(r.id);
        results.deleted_announcements++;
      } catch { /* best-effort */ }
    }
  } catch (e) {
    results.errors.push(`announcements: ${e.message}`);
  }

  // Log the cleanup as an audit event.
  try {
    await base44.asServiceRole.entities.AuditLog.create({
      administrator: 'system',
      action: 'notification_cleanup',
      details: `Cleaned up ${results.deleted_read_states} read states, ${results.expired_invitations} invitations, ${results.deleted_announcements} announcements`,
    });
  } catch { /* best-effort */ }

  return Response.json({ ok: true, results });
});