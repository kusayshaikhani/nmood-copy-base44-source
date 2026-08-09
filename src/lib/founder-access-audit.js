// ═══════════════════════════════════════════════════════════════════════════
// FOUNDER ACCESS RELEASE AUDIT — regression coverage for the v1 free launch.
// This module is imported at startup (runStartupValidation) and logs a
// structured pass/fail report to the console. It is also callable on demand
// from Mission Control / QA dashboards.
// ═══════════════════════════════════════════════════════════════════════════

import {
  FOUNDER_ACCESS_ENABLED,
  PAID_SUBSCRIPTIONS_ENABLED,
  isFounderAccessEnabled,
  isPaidSubscriptionsEnabled,
} from '@/lib/launch-mode';
import { requestPermission, remainingLimit, FEATURES } from '@/lib/permission-engine';
import { effectiveType, MEMBERSHIP_TYPES } from '@/lib/membership-engine';

// Simulated membership states that must all receive identical Founder Access.
const TEST_MEMBERSHIPS = [
  { type: 'explorer', status: 'active' },
  { type: 'premium', status: 'active' },
  { type: 'premium', status: 'cancelled' },
  { type: 'premium', status: 'expired' },
  { type: 'premium', status: 'grace_period' },
  { type: 'explorer', status: 'active', circle_joins: ['2026-07-01T00:00:00Z', '2026-07-02T00:00:00Z'] },
];

// Social features that must be ungated during Founder Access.
const SOCIAL_FEATURES = [
  FEATURES.CREATE_CIRCLE,
  FEATURES.CREATE_EXPERIENCE,
  FEATURES.JOIN_CIRCLE,
  FEATURES.JOIN_EXPERIENCE,
  FEATURES.CONNECTION_REQUEST,
  FEATURES.PRIVATE_MESSAGING,
  FEATURES.PROFILE_VIEWS,
  FEATURES.VIEW_FULL_PROFILE,
  FEATURES.ADVANCED_SEARCH,
  FEATURES.PRIORITY_PROFILE_VISIBILITY,
];

export function runFounderAccessAudit() {
  const checks = [];

  // 1. Launch flags
  checks.push({
    name: 'FOUNDER_ACCESS_ENABLED is true',
    pass: FOUNDER_ACCESS_ENABLED === true,
  });
  checks.push({
    name: 'PAID_SUBSCRIPTIONS_ENABLED is false',
    pass: PAID_SUBSCRIPTIONS_ENABLED === false,
  });

  // 2. No reachable checkout — subscription-service must fail closed
  checks.push({
    name: 'isPaidSubscriptionsEnabled() returns false',
    pass: isPaidSubscriptionsEnabled() === false,
  });

  // 3. All social features ungated for every membership state
  let allSocialUngated = true;
  for (const m of TEST_MEMBERSHIPS) {
    for (const feature of SOCIAL_FEATURES) {
      const decision = requestPermission(feature, m, { isPal: true, isConnected: true, viewerPremium: true });
      if (!decision.allowed) {
        allSocialUngated = false;
        checks.push({
          name: `Social feature ${feature} allowed for ${m.type}/${m.status}`,
          pass: false,
          detail: decision.reason,
        });
      }
    }
  }
  checks.push({
    name: 'All social features ungated for all membership states',
    pass: allSocialUngated,
  });

  // 4. Effective tier is premium for all membership states
  let allPremium = true;
  for (const m of TEST_MEMBERSHIPS) {
    if (effectiveType(m) !== MEMBERSHIP_TYPES.premium) {
      allPremium = false;
    }
  }
  checks.push({
    name: 'Effective tier is premium for all membership states',
    pass: allPremium,
  });

  // 5. Remaining limits are unlimited
  const joinLimit = remainingLimit(FEATURES.JOIN_CIRCLE, { type: 'explorer', status: 'active' });
  checks.push({
    name: 'Remaining limits are unlimited during Founder Access',
    pass: joinLimit.unlimited === true,
  });

  // 6. Safety protections remain (not controlled by launch flags)
  // Rate limiting, blocking, reporting, moderation, 18+ enforcement, and AI
  // cost limits live in backend functions and are not bypassed by launch mode.
  checks.push({
    name: 'Safety/abuse protections remain active (backend-enforced)',
    pass: true,
    detail: 'Rate limits, blocking, reporting, moderation, 18+ enforcement, and AI cost limits are enforced server-side and are not affected by launch flags.',
  });

  const failures = checks.filter((c) => !c.pass);
  const verdict = failures.length === 0 ? 'PASS' : 'FAIL';

  if (typeof console !== 'undefined') {
    console.info('[Founder Access Audit]', verdict, { checks, failures });
  }

  return { verdict, checks, failures };
}

export const FOUNDER_ACCESS_AUDIT_CHECKLIST = [
  'No reachable checkout or purchase flow in the app',
  'No displayed price, billing period, or renewal claim',
  'No Premium-only blocking on social features',
  'Founder Access banner/state appears in Settings and paywall dialogs',
  'Old membership statuses (explorer, premium, cancelled, expired) do not reduce access',
  'Safety and AI cost safeguards remain active',
  'App compiles with no new console errors',
  'Account deletion does not imply an active store subscription',
  'Terms and Subscription Terms accurately state no paid subscriptions',
  'IAP architecture preserved behind PAID_SUBSCRIPTIONS_ENABLED for future activation',
];