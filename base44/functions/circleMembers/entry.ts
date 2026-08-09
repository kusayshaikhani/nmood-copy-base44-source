// SEC Batch 1C — Trusted Circle member listing.
// Verifies the caller's relationship to the Circle before returning memberships.
// Organizers/admins see all statuses (member, pending, banned, removed) with
// full moderation fields (ban_reason). Ordinary members see only active members
// without private moderation fields. Removed/banned/departed users are denied.

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

    if (action === 'listCircleMembers') {
      const circleId = String(body.circleId || '');
      if (!circleId) return json(400, { error: 'invalid_request' });

      // Resolve the caller's CircleMembership and circle creator status.
      const isAdmin = user.role === 'admin' || user.role === 'founder';
      const mine = await svc.entities.CircleMembership.filter({
        circle_id: circleId, member_user_id: String(user.id),
      }).catch(() => []);
      const isOrganizer = (mine || []).some((m) => m.role === 'organizer' && m.status === 'member');
      const isMember = (mine || []).some((m) => m.status === 'member' || m.role === 'organizer');

      // Fallback: circle creator is implicitly an organizer (enables transfer of ownership).
      let isCreator = false;
      let circleRec = null;
      try {
        circleRec = await svc.entities.Circle.get(circleId);
        isCreator = !!(circleRec && circleRec.created_by_id && String(circleRec.created_by_id) === String(user.id));
      } catch { /* not found */ }

      const canModerate = isAdmin || isOrganizer || isCreator;
      const canView = canModerate || isMember;
      if (!canView) {
        return json(403, { error: 'not_member', message: 'Only circle members can view the member list.' });
      }

      // Fetch all memberships for this circle, ordered by join date, safe limit.
      const limit = Math.min(Number(body.limit) || 200, 500);
      const all = await svc.entities.CircleMembership.filter(
        { circle_id: circleId }, '-created_date', limit
      ).catch(() => []);

      // Recalculate member_count server-side from distinct active canonical
      // member_user_ids. Duplicate memberships (race) count once.
      const activeMembers = (all || []).filter((m: any) => m.status === 'member' && m.member_user_id);
      const distinctIds = new Set(activeMembers.map((m: any) => String(m.member_user_id)));
      const activeCount = distinctIds.size;
      if (circleRec && (circleRec.member_count || 0) !== activeCount) {
        await svc.entities.Circle.update(circleId, { member_count: activeCount }).catch(() => {});
      }

      // Project fields based on role.
      let visible;
      if (canModerate) {
        // Organizers/admins see all statuses with full moderation fields.
        visible = (all || []).map((m: any) => ({
          id: m.id,
          circle_id: m.circle_id,
          member_name: m.member_name,
          member_avatar: m.member_avatar,
          role: m.role,
          status: m.status,
          joined_date: m.joined_date,
          ban_reason: m.ban_reason,
          member_user_id: m.member_user_id,
          created_by_id: m.created_by_id,
          created_date: m.created_date,
        }));
      } else {
        // Ordinary members see only active members, no private moderation fields.
        visible = (all || [])
          .filter((m: any) => m.status === 'member')
          .map((m: any) => ({
            id: m.id,
            circle_id: m.circle_id,
            member_name: m.member_name,
            member_avatar: m.member_avatar,
            role: m.role,
            status: m.status,
            joined_date: m.joined_date,
            created_date: m.created_date,
          }));
      }

      return json(200, { ok: true, members: visible, isOrganizer: canModerate });
    }

    return json(400, { error: 'unknown_action' });
  } catch (error) {
    console.error('circleMembers error:', error);
    return json(500, { error: 'Something went wrong. Please try again.' });
  }
});