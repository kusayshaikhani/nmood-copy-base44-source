/**
 * FM-001 Founder Mission Control — Access Control
 *
 * A user is a Founder when their User role is exactly 'founder'. Future
 * administrative roles (super_admin, compliance_admin, trust_safety_admin,
 * support_admin, content_moderator, analytics_viewer) are reserved for later
 * phases and are NOT granted Mission Control access today.
 *
 * Access-denial attempts are recorded for audit logging.
 */
import { base44 } from '@/api/base44Client';

export const FOUNDER_ROLE = 'founder';

/** Reserved future administrative roles — not yet implemented. */
export const FUTURE_ADMIN_ROLES = [
  'super_admin',
  'compliance_admin',
  'trust_safety_admin',
  'support_admin',
  'content_moderator',
  'analytics_viewer',
];

export function isFounder(user) {
  return !!user && user.role === FOUNDER_ROLE;
}

/** Record a denied Mission Control access attempt (fire-and-forget, audit). */
export async function recordMissionControlAccessDenied(user) {
  try {
    await base44.entities.SecurityEvent.create({
      actor: user?.id || user?.email || 'anonymous',
      risk_level: 'medium',
      category: 'permission_violation',
      action: 'mission_control_access_denied',
      action_taken: 'redirected_to_home',
      details: 'Attempted to access Founder Mission Control without the founder role.',
    });
  } catch {
    // Fire-and-forget — never block a redirect on logging failure.
  }
}