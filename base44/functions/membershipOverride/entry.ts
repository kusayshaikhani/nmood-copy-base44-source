import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Founder / Admin Membership Override — server-side only.
 *
 * Allows a Founder (user.role === 'founder') or Admin (user.role === 'admin')
 * to grant, revoke, or modify any member's membership without payment.
 * Every action is:
 *   - Authorized server-side (role check, never client-side)
 *   - Audit-logged with previous and new state
 *   - Rejected with HTTP 403 for non-privileged users
 *
 * Actions:
 *   - read:          returns the target's current membership record
 *   - set_premium:   grants Premium (permanent or with expiry date)
 *   - set_explorer:  revokes Premium and reverts to Explorer
 *
 * Founder-granted Premium uses membership_source = 'founder_override'.
 * Admin-granted Premium uses membership_source = 'admin_override'.
 * Both unlock all Premium features exactly like a paid subscription (same
 * type/status fields the engine reads), but create no invoices, payment
 * records, or renewal cycles (billing_platform = 'admin', no
 * store_transaction_id).
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // ── Server-side workspace-owner authorization (CRITICAL) ──────────
    // The membership override grants/revoke paid Premium without payment, so it
    // is restricted to the verified Workspace Owner only — identified by the
    // server-side SystemConfig owner record (mission_control.owner_user_id),
    // established once via the authorizationGate owner flow. The client-
    // controllable role field is intentionally NOT trusted, so a compromised or
    // elevated role cannot escalate privileges or bypass billing. Fails closed
    // (403) while no owner is recorded.
    const ownerRows = await base44.asServiceRole.entities.SystemConfig
      .filter({ key: 'mission_control.owner_user_id' }).catch(() => []);
    const OWNER_ID = ownerRows && ownerRows[0] ? String(ownerRows[0].value) : '';
    const isOwner = !!OWNER_ID && String(user.id) === OWNER_ID;
    if (!isOwner) {
      try {
        await base44.asServiceRole.entities.SecurityEvent.create({
          actor: user.id || user.email || 'unknown',
          risk_level: 'critical',
          category: 'permission_violation',
          action: 'membership_override_unauthorized',
          action_taken: 'rejected_403',
          details: `Non-owner (id=${user.id || 'none'}, role=${user.role || 'none'}) attempted Membership Override.`,
        });
      } catch { /* fire-and-forget audit */ }
      return Response.json({ error: 'Forbidden: Workspace Owner access required' }, { status: 403 });
    }
    // The owner is treated as the founder for override provenance.
    const isFounder = true;
    const isAdmin = false;

    const body = await req.json().catch(() => ({}));
    const targetUserId = body.target_user_id;
    const action = body.action;

    if (!targetUserId) {
      return Response.json({ error: 'target_user_id is required' }, { status: 400 });
    }

    const targetId = String(targetUserId);

    // ── Resolve the target's membership record (service-role, bypasses RLS) ──
    const existing = await base44.asServiceRole.entities.Membership.filter({ user_id: targetId });
    let membership = existing.length > 0 ? existing[0] : null;

    // ── READ action: return current state without modifying ───────────
    if (action === 'read' || !action) {
      return Response.json({ membership });
    }

    const validActions = ['set_premium', 'set_explorer'];
    if (!validActions.includes(action)) {
      return Response.json({ error: `Invalid action: ${action}` }, { status: 400 });
    }

    // ── Record previous state for audit trail ──────────────────────────
    const previousState = membership ? {
      type: membership.type,
      status: membership.status,
      plan: membership.plan,
      expires_at: membership.expires_at || '',
      membership_source: membership.membership_source || 'purchase',
      billing_platform: membership.billing_platform || 'unknown',
    } : null;

    // ── Build the new membership state ────────────────────────────────
    const now = new Date();
    let newType, newStatus, newPlan, newExpiresAt, newSource;

    if (action === 'set_premium') {
      const permanent = !!body.permanent;
      newType = 'premium';
      newStatus = 'active';
      newPlan = permanent ? (isFounder ? 'founder_granted' : 'admin_granted') : 'premium';
      if (permanent) {
        newExpiresAt = '';
      } else if (body.expires_at) {
        // Accept date-only (YYYY-MM-DD) or full ISO; normalize to ISO string.
        const d = new Date(body.expires_at);
        newExpiresAt = Number.isNaN(d.getTime()) ? '' : d.toISOString();
      } else {
        // Default: 30 days if no expiry specified and not permanent.
        newExpiresAt = new Date(now.getTime() + 30 * 86400000).toISOString();
      }
      newSource = isFounder ? 'founder_override' : 'admin_override';
    } else {
      // set_explorer — revoke premium, revert to free tier.
      newType = 'explorer';
      newStatus = 'active';
      newPlan = '';
      newExpiresAt = '';
      newSource = 'purchase';
    }

    const reason = body.reason ? String(body.reason).slice(0, 500) : '';

    const updateData = {
      type: newType,
      status: newStatus,
      plan: newPlan,
      expires_at: newExpiresAt,
      membership_source: newSource,
      granted_by: action === 'set_premium' ? String(user.id) : '',
      override_reason: reason,
      billing_platform: 'admin',
      auto_renew: false,
      cancelled_at: action === 'set_explorer' ? now.toISOString() : '',
    };

    // ── Persist the change ─────────────────────────────────────────────
    if (membership) {
      membership = await base44.asServiceRole.entities.Membership.update(membership.id, updateData);
    } else {
      membership = await base44.asServiceRole.entities.Membership.create({
        user_id: targetId,
        started_date: now.toISOString().slice(0, 10),
        ...updateData,
      });
    }

    const newState = {
      type: newType,
      status: newStatus,
      plan: newPlan,
      expires_at: newExpiresAt,
      membership_source: newSource,
    };

    // ── Audit log (append-only, never blocks the response) ─────────────
    // PB-002 — Every Founder override creates an immutable AuditLog including:
    //   Founder ID (administrator), Member ID (in details), Previous membership
    //   (previous_value), New membership (new_value), Expiration (in new_value),
    //   Timestamp (created_date), Reason (in details), Override source (in new_value).
    try {
      await base44.asServiceRole.entities.AuditLog.create({
        administrator: user.email || String(user.id),
        action: `membership_override_${action}`,
        target_type: 'Membership',
        target_id: membership.id,
        previous_value: previousState ? JSON.stringify(previousState) : 'none',
        new_value: JSON.stringify(newState),
        details: `${isFounder ? 'Founder' : 'Admin'} override by ${user.email || user.id} on member ${targetId}: ${action}${reason ? ` — ${reason}` : ''}`,
      });
    } catch { /* audit failure must not block the override */ }

    return Response.json({ success: true, membership, previousState, newState });
  } catch (error) {
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
});