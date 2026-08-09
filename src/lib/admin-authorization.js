/**
 * ADM-001 Centralized Administrative Authorization — single source of truth.
 *
 * Determines whether the current user may access Founder Mission Control.
 * This is the ONLY place Mission Control access is decided; all gates (route
 * guards, future UI entry points, future backend enforcement) must call
 * `canAccessMissionControl` / `useMissionControlAccess`.
 *
 * Tiers (evaluated in order):
 *   1. Founder role         — always allowed (intended production owner role)
 *   2. Admin role           — always allowed (production policy: only Admin
 *                             role may access Mission Control)
 *   3. Development override — the Workspace Owner is granted access while the
 *                             app runs in Development Mode. The override is
 *                             automatically disabled in Production.
 *
 * This does NOT modify the Base44 Workspace Owner account, does NOT modify
 * the application's role system, and does NOT bypass Base44 security — it is
 * an authorization layer that reads the user's legitimate app role plus a
 * server-resolved owner identity.
 *
 * Future enterprise RBAC roles extend the ADMIN_ROLES set and the
 * `getWorkspaceOwnerId` resolver.
 */
import { IS_DEV } from '@/lib/runtime-env';
import { isFounder } from '@/lib/founder-access';
import { base44 } from '@/api/base44Client';

/** Roles that grant Mission Control access in every environment. */
export const ADMIN_ROLES = ['founder', 'admin'];

/** True only while Vite is running the app in development mode. */
export function isDevelopmentMode() {
  return IS_DEV;
}

/**
 * Pure policy check. Pass the Workspace Owner's user id (resolved via
 * `getWorkspaceOwnerId`) to enable the development override; pass null/omit
 * it to evaluate the role-based tiers only.
 */
export function canAccessMissionControl(user, ownerUserId) {
  if (!user) return false;
  // Tier 1 — Founder role (always)
  if (isFounder(user)) return true;
  // Tier 2 — Admin role (always; production policy)
  if (user.role === 'admin') return true;
  // Tier 3 — Development override (workspace owner, development mode only)
  if (isDevelopmentMode() && ownerUserId && String(user.id) === String(ownerUserId)) {
    return true;
  }
  return false;
}

// --- Workspace Owner resolution ---------------------------------------------
// The Base44 platform does not expose the Workspace Owner flag to the app, and
// the owner's app role is protected from being changed. `resolveOwner` records
// the owner's user id once (SystemConfig) so the owner can be recognized
// independently of the app role — the foundation for future enterprise RBAC.

let _ownerId = null;
let _ownerInflight = null;

/**
 * Resolve the Workspace Owner's user id server-side (cached for the session).
 * Returns '' when unresolved. Safe to call repeatedly.
 */
export function getWorkspaceOwnerId() {
  if (_ownerId !== null) return Promise.resolve(_ownerId);
  if (_ownerInflight) return _ownerInflight;
  _ownerInflight = base44.functions
    .invoke('authorizationGate', { action: 'resolveOwner' })
    .then((res) => {
      _ownerId = (res && res.owner_user_id) || '';
      return _ownerId;
    })
    .catch(() => {
      _ownerId = '';
      return '';
    })
    .finally(() => {
      _ownerInflight = null;
    });
  return _ownerInflight;
}

/** Reset the cached owner id (e.g. on logout). */
export function resetWorkspaceOwnerCache() {
  _ownerId = null;
  _ownerInflight = null;
}