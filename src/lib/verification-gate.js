// PV-GATE — Reusable, configurable verification gate.
// Checks phone_verified / identity_verified before allowing a trust-sensitive
// action. ROLLOUT IS CONFIGURABLE: every gate is OFF by default because the
// product has no existing verification gating. Flip a flag to true to enforce
// at the corresponding surface (create Experience/Circle, join/request, or
// message). The guard is reusable and does not change any existing flow until
// enabled.

export const VERIFICATION_GATE_CONFIG = {
  createExperience: { phone: false, identity: false },
  createCircle: { phone: false, identity: false },
  join: { phone: false, identity: false },
  message: { phone: false, identity: false },
};

/**
 * Returns { allowed, reason?, missing? } for an action.
 * @param {string} action - 'createExperience'|'createCircle'|'join'|'message'
 * @param {Object} member - current member (phone_verified, identity_verified)
 */
export function checkVerificationGate(action, member) {
  const cfg = VERIFICATION_GATE_CONFIG[action];
  if (!cfg) return { allowed: true };
  const m = member || {};
  const missing = [];
  if (cfg.phone && !m.phone_verified) missing.push('phone');
  if (cfg.identity && !m.identity_verified) missing.push('identity');
  if (missing.length) return { allowed: false, reason: 'verification_required', missing };
  return { allowed: true };
}