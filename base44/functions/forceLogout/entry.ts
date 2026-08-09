// PB-007 — Founder / Admin Force Logout.
//
// Immediately invalidates all active sessions for a target member by setting
// a `force_logout_at` timestamp on the Member entity. The client-side
// AuthContext polls this field and calls base44.auth.logout() when the
// timestamp is newer than the current session start, requiring the user to
// log in again.
//
// Authorization: Founder (role === 'founder') or Admin (role === 'admin') only.
// Every action is audit-logged with the actor's identity.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Server-side authorization: only founder or admin can force logout.
    const isFounder = user.role === 'founder';
    const isAdmin = user.role === 'admin';
    if (!isFounder && !isAdmin) {
      // Log the unauthorized attempt as a security event.
      try {
        await base44.asServiceRole.entities.SecurityEvent.create({
          actor: user.email || user.id || 'unknown',
          risk_level: 'high',
          category: 'permission_violation',
          action: 'force_logout_unauthorized',
          details: `Non-privileged user attempted force logout`,
        });
      } catch { /* audit best-effort */ }
      return Response.json({ error: 'Forbidden — Founder or Admin only' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { member_id, reason } = body;
    if (!member_id) return Response.json({ error: 'member_id is required' }, { status: 400 });

    // Fetch the target member record.
    let target;
    try {
      target = await base44.entities.Member.get(member_id);
    } catch {
      return Response.json({ error: 'Member not found' }, { status: 404 });
    }

    // Set force_logout_at to now — the client checks this on next poll.
    const now = new Date().toISOString();
    await base44.entities.Member.update(member_id, {
      force_logout_at: now,
    });

    // Audit log — append-only trail of who forced logout and when.
    try {
      await base44.asServiceRole.entities.AuditLog.create({
        administrator: user.email || user.id,
        action: 'force_logout',
        target_type: 'member',
        target_id: member_id,
        new_value: now,
        details: reason || `${isFounder ? 'Founder' : 'Admin'} forced logout for member ${target.display_name || target.email || member_id}`,
      });
    } catch { /* audit best-effort — don't block the action */ }

    // Security event — informational for audit trail.
    try {
      await base44.asServiceRole.entities.SecurityEvent.create({
        actor: user.email || user.id,
        risk_level: 'medium',
        category: 'admin_change',
        action: 'force_logout',
        action_taken: 'sessions_invalidated',
        details: `Force logout executed on member ${member_id}`,
      });
    } catch { /* best-effort */ }

    return Response.json({
      ok: true,
      member_id,
      force_logout_at: now,
    });
  } catch (error) {
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
});