import { readRecommendationPeople } from '@/lib/recommendation-people';
import { MAIN_PASSPORT } from '@/lib/passport/enabled';
// Member discovery, backed by Supabase.
//
// The previous implementation called the Base44 `authorizationGate` backend
// function, which does not answer in the independently hosted build, so every
// people-discovery surface (Discover, Search, Nearby, New Pals, AI matching)
// silently received an empty list.
//
// Visibility is ultimately enforced by RLS on public.members; the filters here
// additionally exclude members who are not discoverable, and blocked members in
// either direction.
import { callSupabaseRpc, getSupabaseSession, getMyMemberBlocks } from '@/api/supabaseClient';


function toMember(row) {
  return {
    ...row,
    user_id: row.id,
    created_by_id: row.id,
    name: row.display_name || [row.first_name, row.last_name].filter(Boolean).join(' '),
    verified: row.identity_verified === true && row.email_verified === true && row.phone_verified === true,
    created_date: row.created_at,
    updated_date: row.updated_at,
  };
}

async function blockedIdSet() {
  try {
    const rows = await getMyMemberBlocks();
    const ids = new Set();
    (rows || []).forEach((b) => {
      if (b.blocked_member_id) ids.add(b.blocked_member_id);
      if (b.blocker_id) ids.add(b.blocker_id);
    });
    return ids;
  } catch {
    // member_blocks may not exist yet; blocking is then simply not applied.
    return new Set();
  }
}


// The RPC returns an allowlisted shape after enforcing these rules server-side,
// so absent policy fields are trusted. Date of birth is optional and must not
// affect who can appear in Discovery; never fall back to unprojected member rows.
function isEligibleDiscoveryMember(row) {
  if (!row?.id || row.onboarding_completed === false) return false;
  if (row.account_state != null && row.account_state !== 'active') return false;
  if (row.admin_status != null && row.admin_status !== 'active') return false;
  if (row.eligibility_status != null && row.eligibility_status !== 'verified') return false;
  return !Object.hasOwn(row, 'profile_visibility') || row.profile_visibility === 'public';
}

/**
 * Discoverable, eligibility-verified members. Excludes the signed-in member,
 * blocked members, hidden/paused/disabled accounts and explicitly private profiles.
 * @param {number} limit
 * @returns {Promise<Array>}
 */
export async function fetchDiscoverableMembers(limit = 100, { signal, global = false } = {}) {
  const myId = getSupabaseSession()?.user?.id;
  const capped = Math.max(1, Math.min(Number(limit) || 100, 200));
  // A denied or failed projection is never downgraded to a raw member read.
  const rows = await (global
    ? callSupabaseRpc('nmood_list_discoverable_members', { p_limit: capped }, ...(signal ? [{ signal }] : []))
    : (MAIN_PASSPORT ? readRecommendationPeople(capped, signal) : callSupabaseRpc('nmood_list_discoverable_members', { p_limit: capped }, ...(signal ? [{ signal }] : []))));
  const blocked = await blockedIdSet();
  return (rows || [])
    .filter((row) => isEligibleDiscoveryMember(row) && row.id !== myId && !blocked.has(row.id))
    .map(toMember);
}

/** Recent Home cards use the server's safe preview projection for every tier. */
export async function fetchNewPals({ limit = 100, signal } = {}) {
  const capped = Math.max(1, Math.min(Number(limit) || 100, 100));
  const rows = await (MAIN_PASSPORT ? readRecommendationPeople(capped, signal) : callSupabaseRpc('list_new_pals', { p_hours:72,p_limit:capped }, ...(signal ? [{signal}] : [])));
  const myId = getSupabaseSession()?.user?.id;
  const blocked = await blockedIdSet();
  return (rows || []).filter(row => (!MAIN_PASSPORT || Date.parse(row.created_at) >= Date.now()-72*3600000) && isEligibleDiscoveryMember(row) && row.id !== myId && !blocked.has(row.id)).map(toMember);
}
