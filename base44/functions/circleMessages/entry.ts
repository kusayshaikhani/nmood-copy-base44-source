// SEC Batch 1B — Trusted Circle message read action.
// Verifies an authoritative active CircleMembership before returning messages.
// Does NOT rely on potentially stale member_of_circles metadata.
// Pending, removed, banned or departed members are denied.

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

    if (action === 'listCircleMessages') {
      const circleId = String(body.circleId || '');
      if (!circleId) return json(400, { error: 'invalid_request' });

      // Verify the caller has an authoritative active CircleMembership.
      // Admins/founders bypass the membership check.
      const isAdmin = user.role === 'admin' || user.role === 'founder';
      if (!isAdmin) {
        const mine = await svc.entities.CircleMembership.filter({
          circle_id: circleId, member_user_id: String(user.id),
        }).catch(() => []);
        // Only active members (status === 'member') can read messages.
        // Pending, removed, banned or departed members are denied.
        const activeMember = (mine || []).find((m) => m.status === 'member');
        if (!activeMember) {
          return json(403, { error: 'not_member', message: 'Only active circle members can view messages.' });
        }
      }

      // Return only messages for this circle, ordered chronologically, limited.
      const limit = Math.min(Number(body.limit) || 200, 500);
      const messages = await svc.entities.CircleChatMessage.filter(
        { circle_id: circleId }, '-created_date', limit
      ).catch(() => []);

      // Sort ascending by created_date for chat display.
      const sorted = (messages || []).sort((a: any, b: any) =>
        new Date(a.created_date).getTime() - new Date(b.created_date).getTime()
      );

      return json(200, { ok: true, messages: sorted });
    }

    return json(400, { error: 'unknown_action' });
  } catch (error) {
    console.error('circleMessages error:', error);
    return json(500, { error: 'Something went wrong. Please try again.' });
  }
});