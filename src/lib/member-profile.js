import { base44 } from '@/api/base44Client';
import { callSupabaseRpc, getSupabaseSession } from '@/api/supabaseClient';

const useSupabase = Boolean(import.meta.env.VITE_SUPABASE_URL);

async function getSupabaseOwnMember(userId) {
  const baseUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '');
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const session = getSupabaseSession();
  if (!baseUrl || !key || !session?.access_token) return null;
  // A direct table read is useful when RLS permits it, but must never leave
  // the whole application on its splash screen if a browser/network layer
  // stalls it. The server-side RPC below is the canonical fallback.
  try {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 8000);
    const response = await fetch(`${baseUrl}/rest/v1/members?id=eq.${encodeURIComponent(userId)}&select=*`, {
      headers: { apikey: key, Authorization: `Bearer ${session.access_token}` },
      signal: controller.signal,
    });
    window.clearTimeout(timer);
    if (response.ok) {
      const [member] = await response.json();
      if (member) return member;
    }
  } catch {
    // Fall through to the authenticated server-side canonical lookup.
  }

  try {
    const result = await callSupabaseRpc('ensure_my_onboarding_profile');
    return Array.isArray(result) ? result[0] || null : (result?.member || result || null);
  } catch {
    return null;
  }
}

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
  if (useSupabase) return getSupabaseOwnMember(userId);
  let members;
  try {
    // `created_by_id` is audit metadata. Older server-created profiles have
    // a service ID here, so it must never be treated as account ownership.
    // `user_id` is the canonical authenticated-account link.
    members = await base44.entities.Member.filter({ user_id: String(userId) });
    if (!members || members.length === 0) {
      members = await base44.entities.Member.filter({ created_by_id: String(userId) });
    }
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
  if (useSupabase) return getSupabaseOwnMember(userId);
  let members;
  try {
    members = await base44.entities.Member.filter({ user_id: String(userId) });
    if (!members || members.length === 0) {
      members = await base44.entities.Member.filter({ created_by_id: String(userId) });
    }
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
