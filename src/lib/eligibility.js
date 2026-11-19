import { useSupabase } from '@/config/supabase-config';

/**
 * AGE-001 — Central Eligibility Engine.
 *
 * Privacy-safe age helpers. Date of birth is optional and must never block
 * onboarding, Discovery, messaging, or other ordinary member features.
 * It remains private and is used only to calculate a voluntary age display.
 */

export const ELIGIBILITY_STATUS = {
  VERIFIED: 'verified',        // DOB confirmed, 18+
  PENDING: 'pending',          // DOB not yet provided
  UNDER_REVIEW: 'under_review', // DOB indicates under 18 (admin review)
  RESTRICTED: 'restricted',     // Admin-set restriction
};

export const MIN_AGE = 18;

/**
 * Calculate exact age from a date-of-birth string.
 * Returns null for missing/invalid dates.
 * A user has reached age N on their Nth birthday (month + day match).
 */
export function calculateAge(dob) {
  if (!dob) return null;
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  // Future birth dates are invalid.
  if (birth.getTime() > today.getTime()) return null;
  let age = today.getFullYear() - birth.getFullYear();
  const hasHadBirthdayThisYear =
    today.getMonth() > birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());
  if (!hasHadBirthdayThisYear) age--;
  return age;
}

/**
 * Validate a voluntarily supplied date of birth.
 * Returns { valid, age, error }.
 *  - valid: true only if the date is parseable and not in the future.
 *  - error: one of 'missing' | 'invalid' | 'future' | null
 */
export function validateDob(dob) {
  if (!dob || !String(dob).trim()) {
    return { valid: false, age: null, error: 'missing' };
  }
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) {
    return { valid: false, age: null, error: 'invalid' };
  }
  const today = new Date();
  if (birth.getTime() > today.getTime()) {
    return { valid: false, age: null, error: 'future' };
  }
  const age = calculateAge(dob);
  if (age === null) {
    return { valid: false, age: null, error: 'invalid' };
  }
  return { valid: true, age, error: null };
}

/**
 * A missing date of birth is never a feature gate. Administrative restrictions
 * remain effective independently of whether a member provided a DOB.
 */
export function isEligible(member) {
  if (!member) return false;
  if (member.eligibility_status === ELIGIBILITY_STATUS.RESTRICTED) return false;
  return true;
}

/**
 * DOB is optional, so no member is pending just because it is absent.
 */
export function isPendingEligibility() {
  return false;
}

/**
 * Optional DOB does not place a member under review.
 */
export function isUnderReview() {
  return false;
}

/**
 * Returns true if the member is restricted by an admin.
 * This is the only status that is NOT DOB-based — it's set by admins.
 */
export function isRestricted(member) {
  if (!member) return false;
  return member.eligibility_status === ELIGIBILITY_STATUS.RESTRICTED;
}

/**
 * A DOB does not determine access status. Retained for callers that need a
 * neutral legacy status while the database transition is deployed.
 */
export function statusFromDob() {
  return ELIGIBILITY_STATUS.PENDING;
}

/**
 * Returns true if a DOB change is allowed for this member.
 * An optional DOB can be supplied or changed unless the account itself is
 * administratively restricted.
 */
export function canChangeDob(member) {
  return !member || !isRestricted(member);
}

/**
 * Build the member payload for eligibility update after DOB is set.
 *
 * SECURITY (AGE-001): Does NOT include eligibility_status — that field is
 * derived server-side by the authorizationGate `updateDob` action. The client
 * must never set eligibility_status directly; a user could otherwise self-verify
 * without a valid DOB. This function now returns an empty object (DOB is set
 * separately by the caller via the backend updateDob action).
 */
export function eligibilityPayload(dob) {
  // eligibility_status is derived server-side — never set it client-side.
  return {};
}

/**
 * Returns true if the member has completed onboarding.
 *
 * Uses the canonical `onboarding_completed` flag as the primary source of
 * truth. For legacy members who predate the flag (undefined/null), infers
 * completion from a display name; DOB is optional.
 *
 * This is the single source of truth for onboarding completion status across
 * the app — used by EligibilityGate, post-auth-resolver, and the Onboarding
 * page itself.
 */
export function isOnboardingComplete(member) {
  if (!member) return false;
  if (member.onboarding_completed === true) return Boolean(member.display_name?.trim());
  if (member.onboarding_completed === false) return false;
  // Legacy: undefined/null — infer from canonical profile data.
  return Boolean(member.display_name?.trim());
}
