import { base44 } from '@/api/base44Client';

/**
 * Resolve the authenticated user's genuine Member profile.
 *
 * The Member entity may contain several records sharing the same
 * created_by_id (e.g. imported demo/seed members stamped with the
 * founder's user id). Blindly taking members[0] returned a demo record
 * — surfacing another person's photo and name on the signed-in user's
 * profile — so this helper selects the user's real onboarding record.
 *
 * Selection order:
 *   1. Filter by created_by_id === userId (the authenticated user).
 *   2. If multiple, prefer records whose email matches the user's email.
 *   3. Among those, prefer onboarding_completed === true.
 *   4. Tie-break by earliest created_date (the genuine onboarding record).
 *
 * Never returns another user's profile: created_by_id + email match
 * guarantees the record belongs to the authenticated user. Returns null
 * when no profile exists (callers redirect to onboarding, which creates
 * a fresh record linked to the user's id).
 */
export async function getOwnMember(userId, userEmail) {
  if (!userId) return null;
  let members;
  try {
    members = await base44.entities.Member.filter({ created_by_id: userId });
    // createProfile runs as the service role, so created_by_id is stamped
    // with the service role id — not the user's id. For members created via
    // onboarding, fall back to email (set to user.email by createProfile).
    if ((!members || members.length === 0) && userEmail) {
      members = await base44.entities.Member.filter({ email: userEmail });
    }
  } catch {
    return null;
  }
  return pickGenuineMember(members, userEmail);
}

/**
 * Resolve another user's Member profile by their user id. Same
 * disambiguation as getOwnMember (prefers the onboarding record) but
 * without an email to match against. Use for pal / host / reviewer
 * lookups where only the other user's id is known.
 */
export async function getMemberByUserId(userId) {
  if (!userId) return null;
  let members;
  try {
    members = await base44.entities.Member.filter({ created_by_id: userId });
  } catch {
    return null;
  }
  return pickGenuineMember(members);
}

function pickGenuineMember(members, preferredEmail) {
  if (!members || members.length === 0) return null;
  if (members.length === 1) return members[0];

  let pool = members;
  if (preferredEmail) {
    const lower = preferredEmail.toLowerCase();
    const byEmail = members.filter((m) => m.email && m.email.toLowerCase() === lower);
    if (byEmail.length > 0) pool = byEmail;
  }
  const onboarded = pool.filter((m) => m.onboarding_completed);
  if (onboarded.length > 0) pool = onboarded;
  return pool
    .slice()
    .sort((a, b) => new Date(a.created_date).getTime() - new Date(b.created_date).getTime())[0];
}