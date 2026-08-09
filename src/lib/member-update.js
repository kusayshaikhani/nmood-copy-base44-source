// AGE-001 — Centralized member self-update helpers.
//
// All member self-updates MUST go through the backend authorizationGate
// `updateProfile` action, which strips protected fields (date_of_birth,
// eligibility_status, eligibility_verified_at, dob_change_requested_at).
// Direct Member.update() calls are blocked by RLS — the Member entity's
// update rule only allows admin/founder roles.
//
// DOB updates go through `updateDob` (derives eligibility_status server-side).
// Account deletion goes through `deleteAccount` (the only action that can
// clear date_of_birth as part of anonymization).
//
// SDK result normalization: base44.functions.invoke may return the backend
// response body directly ({ ok, member }) OR wrapped in { data: { ok, member } }
// depending on the SDK version / edge configuration. unwrap() handles both so
// success/failure is based on the normalized payload, never on assuming
// res vs res.data.

import { base44 } from '@/api/base44Client';

/**
 * Unwrap a backend function response.
 * Supports both a direct response object and a { data } wrapper.
 * Returns null for empty responses.
 */
function unwrap(res) {
  if (!res) return null;
  // Wrapped form: { data: { ok, member, ... } }
  if (
    res.data &&
    typeof res.data === 'object' &&
    !Array.isArray(res.data) &&
    ('ok' in res.data || 'error' in res.data || 'member' in res.data)
  ) {
    return res.data;
  }
  // Direct form: { ok, member, ... }
  return res;
}

/**
 * Resolve the normalized payload, throwing a friendly error when the backend
 * reported failure (ok === false) or returned no payload at all.
 */
function requireOk(res, fallbackMessage) {
  const body = unwrap(res);
  if (!body) {
    throw new Error(fallbackMessage);
  }
  if (body.ok === false || body.error) {
    throw new Error(body.message || body.error || fallbackMessage);
  }
  return body;
}

/**
 * Update the authenticated user's own Member profile.
 * Protected fields are stripped server-side by the backend.
 * @param {Object} fields - Non-protected fields to update.
 * @returns {Promise<Object>} The updated member record.
 */
export async function updateMemberProfile(fields) {
  const res = await base44.functions.invoke('authorizationGate', {
    action: 'updateProfile',
    fields,
  });
  const body = requireOk(res, 'Could not update your profile. Please try again.');
  return body.member;
}

/**
 * Create the authenticated user's Member profile during onboarding.
 * Server-side validates that a profile photo is present before creating.
 * Protected fields are stripped server-side by the backend.
 * @param {Object} fields - Non-protected fields for the new member.
 * @returns {Promise<Object>} The created member record.
 */
export async function createMemberProfile(fields) {
  const res = await base44.functions.invoke('authorizationGate', {
    action: 'createProfile',
    fields,
  });
  const body = requireOk(res, 'Could not create your profile. Please try again.');
  return body.member;
}

/**
 * Idempotent find-or-create Member profile at signup (email flow).
 * Called after OTP verification with the first name, last name, email, and
 * DOB collected on the Create Account form. The backend derives eligibility
 * server-side and sets onboarding_completed, so the user goes directly to
 * Home — no duplicate name/DOB onboarding screens, no standalone DOB gate.
 * @param {Object} params - { first_name, last_name, email, dob }
 * @returns {Promise<Object>} The backend response body ({ ok, member, created }).
 */
export async function registerMemberProfile({ first_name, last_name, email, dob }) {
  const res = await base44.functions.invoke('authorizationGate', {
    action: 'registerProfile',
    first_name,
    last_name,
    email,
    dob,
  });
  const body = requireOk(res, 'Could not create your profile. Please try again.');
  return body;
}

/**
 * Update the authenticated user's date of birth.
 * The backend derives eligibility_status server-side — the client never
 * sets eligibility_status directly. Verified members cannot self-serve a
 * DOB change (must contact Support).
 * @param {string} dob - ISO date string (YYYY-MM-DD).
 * @returns {Promise<Object>} The backend response body ({ ok, member, eligibility_status }).
 */
export async function updateMemberDob(dob) {
  const res = await base44.functions.invoke('authorizationGate', {
    action: 'updateDob',
    dob,
  });
  const body = requireOk(res, 'Could not update your date of birth. Please try again.');
  return body;
}

/**
 * Delete the authenticated user's own account.
 * Anonymizes all personal data including DOB (protected field).
 * @returns {Promise<Object>} The anonymized member record.
 */
export async function deleteMemberAccount() {
  const res = await base44.functions.invoke('authorizationGate', {
    action: 'deleteAccount',
  });
  const body = requireOk(res, 'Could not delete your account. Please try again.');
  return body.member;
}

/**
 * Fetch the server-side filtered, eligibility-verified member list for
 * Discover, Search, and AI recommendations. Excludes ineligible members
 * (no DOB, under 18, suspended, deleted, not onboarded, private) at the
 * query level — client-side filtering is a secondary safeguard only.
 * @param {number} limit - Max members to return (default 100, max 200).
 * @returns {Promise<Array>} Array of discoverable member objects.
 */
export async function fetchDiscoverableMembers(limit = 100) {
  const res = await base44.functions.invoke('authorizationGate', {
    action: 'discoverMembers',
    limit,
  });
  const body = unwrap(res);
  return body?.members || [];
}