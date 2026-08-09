// Profile completion + trust-score calculation — shared by ProfileStatusCard
// and the Trust & Verification breakdown so the two never diverge.
//
// Completion reflects ONLY the fields onboarding actually requires and
// validates. Optional profile attributes (bio, photo, lifestyle) and
// trust/verification steps (email, phone) are NOT completion blockers —
// they are surfaced separately in the Trust & Verification breakdown and
// factored into the trust score. This keeps a fully-onboarded profile at
// 100% with no completion nudges.

export const COMPLETENESS_CHECKS = [
  { key: 'first_name', label: 'First Name', target: 'first_name', min: 1 },
  { key: 'last_name', label: 'Last Name', target: 'last_name', min: 1 },
  { key: 'display_name', label: 'Display Name', target: 'display_name', min: 1 },
  { key: 'date_of_birth', label: 'Date of Birth', target: 'dob', min: 1 },
  { key: 'gender', label: 'Gender', target: 'gender', min: 1 },
  { key: 'country', label: 'Country', target: 'country', min: 1 },
  { key: 'city', label: 'City', target: 'city', min: 1 },
  { key: 'languages', label: 'Languages', target: 'languages', min: 1, array: true },
  { key: 'interests', label: 'Interests', target: 'interests', min: 3, array: true },
];

export function isCheckFilled(member, check, user) {
  if (check.check) return check.check(member, user);
  const val = member ? member[check.key] : undefined;
  const len = Array.isArray(val) ? val.length : val ? String(val).trim().length : 0;
  return len >= check.min;
}

export function getProfileCompleteness(member, user) {
  const total = COMPLETENESS_CHECKS.length;
  if (!member) return { pct: 0, missing: COMPLETENESS_CHECKS, filled: 0, total };
  const missing = COMPLETENESS_CHECKS.filter((c) => !isCheckFilled(member, c, user));
  const filled = total - missing.length;
  return { pct: Math.round((filled / total) * 100), missing, filled, total };
}

// Five equally-weighted trust factors (20 pts each): Email, Phone, Photo,
// Profile Complete, Community Standing.
export function getTrustScore(member, user, completenessPct) {
  if (!member) return 0;
  const profileComplete = completenessPct >= 100;
  const goodStanding = member.admin_status !== 'suspended' && member.admin_status !== 'deactivated';
  let score = 0;
  if (user?.email) score += 20;
  if (member.phone_verified) score += 20;
  if (member.photo_url) score += 20;
  if (profileComplete) score += 20;
  if (goodStanding) score += 20;
  return score;
}