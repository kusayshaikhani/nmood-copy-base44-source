// SEC Batch 1C — Trusted Experience attendee listing.
// Verifies the Experience exists and the caller's relationship before returning
// attendance records. Hosts/admins see the full management list (going, waiting,
// left) with all fields. Ordinary attendees see only 'going' attendees with
// public fields (name, avatar). Unrelated users are denied.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { json } from '../../shared/concierge-utils.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return json(401, { error: 'unauthorized' });
    const svc = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const action = body.action;

    if (action === 'listExperienceAttendees') {
      const experienceId = body.experienceId;
      if (!experienceId) return json(400, { error: 'invalid_request' });

      // Verify the Experience exists.
      const exp = await svc.entities.Experience.get(experienceId).catch(() => null);
      if (!exp) return json(404, { error: 'not_found', message: 'Experience not found.' });

      const isAdmin = user.role === 'admin' || user.role === 'founder';
      const isHost = !!(exp.host_user_id && String(exp.host_user_id) === String(user.id));

      // Check if the caller is an attendee (going or waiting).
      const mine = await svc.entities.Attendance.filter({
        experience_id: experienceId, member_user_id: String(user.id),
      }).catch(() => []);
      const isAttendee = (mine || []).some((a: any) => a.status === 'going' || a.status === 'waiting');

      const canManage = isAdmin || isHost;
      const canView = canManage || isAttendee;
      if (!canView) {
        return json(403, { error: 'not_authorized', message: 'Only attendees and the host can view the attendee list.' });
      }

      // Fetch all attendance records for this experience, ordered by join date.
      const limit = Math.min(Number(body.limit) || 200, 500);
      const all = await svc.entities.Attendance.filter(
        { experience_id: experienceId }, '-created_date', limit
      ).catch(() => []);

      // Project fields based on role.
      let visible;
      if (canManage) {
        // Hosts/admins see all statuses with full management fields.
        visible = (all || []).map((a: any) => ({
          id: a.id,
          experience_id: a.experience_id,
          member_name: a.member_name,
          member_avatar: a.member_avatar,
          status: a.status,
          arrived: a.arrived,
          arrived_at: a.arrived_at,
          reminders_enabled: a.reminders_enabled,
          member_user_id: a.member_user_id,
          created_date: a.created_date,
        }));
      } else {
        // Ordinary attendees see only 'going' attendees with public fields.
        // Left/removed/waiting records are excluded.
        visible = (all || [])
          .filter((a: any) => a.status === 'going')
          .map((a: any) => ({
            id: a.id,
            member_name: a.member_name,
            member_avatar: a.member_avatar,
            status: a.status,
          }));
      }

      return json(200, { ok: true, attendees: visible, isHost: canManage });
    }

    return json(400, { error: 'unknown_action' });
  } catch (error) {
    console.error('experienceAttendees error:', error);
    return json(500, { error: 'Something went wrong. Please try again.' });
  }
});