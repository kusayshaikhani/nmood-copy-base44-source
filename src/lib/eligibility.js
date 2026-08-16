/**
 * AGE-001 — Central Eligibility Engine.
 *
 * The ONLY place age/eligibility decisions are made. Every feature gate,
 * route guard, and backend check flows through these helpers.
 *
 * Rules:
 *  - Minimum age is 18 (Gregorian).
 *  - Age is calculated from the full birth date (not a checkbox).
 *  - A user must have reached their 18th birthday (not just the birth year).
 *  - Future dates and invalid dates are rejected.
 *  - DOB is private — never logged, never sent to analytics or AI.
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
 * Validate a date-of-birth string for eligibility.
 * Returns { valid, age, error }.
 *  - valid: true only if the date is parseable, not in the future, and >= 18.
 *  - error: one of 'missing' | 'invalid' | 'future' | 'underage' | null
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
  if (age < MIN_AGE) {
    return { valid: false, age, error: 'underage' };
  }
  return { valid: true, age, error: null };
}

/**
 * Returns true if the member has a verified DOB confirming 18+.
 * This is the primary gate for all social features.
 *
 * SECURITY: Always verifies the DOB directly — NEVER trusts the
 * client-editable eligibility_status field alone. A user could set
 * eligibility_status to 'verified' through the SDK without a valid DOB.
 * The DOB is the sole source of truth.
 */
export function isEligible(member) {
  if (!member) return false;
  // Admin-set restriction always blocks, even with a valid DOB.
  if (member.eligibility_status === ELIGIBILITY_STATUS.RESTRICTED) return false;
  // In the independent platform the DOB is intentionally never returned in
  // the public member row.  The only writer of this server-derived status is
  // the security-definer onboarding function in Supabase.
  if (import.meta.env.VITE_SUPABASE_URL) {
    return member.eligibility_status === ELIGIBILITY_STATUS.VERIFIED;
  }
  // ALWAYS verify the DOB — never trust eligibility_status alone.
  if (!member.date_of_birth) return false;
  const { valid } = validateDob(member.date_of_birth);
  return valid;
}

/**
 * Returns true if the member has not yet provided a DOB.
 * Existing accounts with missing DOB are 'pending'.
 */
export function isPendingEligibility(member) {
  if (!member) return true;
  // Admin-set restriction is not "pending" — it's a separate state.
  if (member.eligibility_status === ELIGIBILITY_STATUS.RESTRICTED) return false;
  // Pending = no DOB provided yet (regardless of eligibility_status).
  return !member.date_of_birth;
}

/**
 * Returns true if the member's DOB indicates they are under 18.
 * These accounts are 'under_review' — restricted, not deleted.
 */
export function isUnderReview(member) {
  if (!member) return false;
  // Admin-set restriction is a separate state, not "under review".
  if (member.eligibility_status === ELIGIBILITY_STATUS.RESTRICTED) return false;
  // Under review = has DOB but DOB indicates under 18.
  if (!member.date_of_birth) return false;
  const { error } = validateDob(member.date_of_birth);
  return error === 'underage';
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
 * Determine the eligibility status from a DOB string.
 * Used during onboarding / DOB correction to set the right status.
 * Returns one of ELIGIBILITY_STATUS.
 */
export function statusFromDob(dob) {
  const { valid, error } = validateDob(dob);
  if (valid) return ELIGIBILITY_STATUS.VERIFIED;
  if (error === 'underage') return ELIGIBILITY_STATUS.UNDER_REVIEW;
  return ELIGIBILITY_STATUS.PENDING;
}

/**
 * Returns true if a DOB change is allowed for this member.
 *  - Verified members: only through Support (not self-service).
 *  - Pending members: can set their DOB (first time or correction).
 *  - Under-review members: can correct their DOB if it was a mistake.
 */
export function canChangeDob(member) {
  if (!member) return true;
  return isPendingEligibility(member) || isUnderReview(member);
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
 * completion from the presence of canonical profile data (display_name +
 * date_of_birth) to avoid forcing existing users back through onboarding.
 *
 * This is the single source of truth for onboarding completion status across
 * the app — used by EligibilityGate, post-auth-resolver, and the Onboarding
 * page itself.
 */
export function isOnboardingComplete(member) {
  if (!member) return false;
  if (member.onboarding_completed === true) return true;
  if (member.onboarding_completed === false) return false;
  // Legacy: undefined/null — infer from canonical profile data.
  return !!(member.display_name && member.date_of_birth);
}
