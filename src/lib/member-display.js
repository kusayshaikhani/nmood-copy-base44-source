/**
 * Resolve the authenticated member's display name and initials with a single,
 * app-wide priority chain. Used everywhere the CURRENT user's own identity is
 * shown (top bar, avatar, profile header, greetings, share sheet).
 *
 *   1. display_name              — primary, user-chosen
 *   2. first_name + last_name    — combined when both exist
 *   3. first_name | last_name     — whichever exists alone
 *   4. user.full_name            — auth profile name (last resort)
 *   5. null                      — caller renders a localized fallback
 *
 * For OTHER members' names (discovery, chat, reviews) use resolveMemberNames
 * (member-names.js), which is server-gated by the viewer's subscription.
 */
export function resolveMemberName(member, user) {
  if (member) {
    const dn = typeof member.display_name === 'string' ? member.display_name.trim() : '';
    if (dn) return dn;
    const first = typeof member.first_name === 'string' ? member.first_name.trim() : '';
    const last = typeof member.last_name === 'string' ? member.last_name.trim() : '';
    if (first && last) return `${first} ${last}`;
    if (first) return first;
    if (last) return last;
  }
  if (user) {
    const fn = typeof user.full_name === 'string' ? user.full_name.trim() : '';
    if (fn) return fn;
  }
  return null;
}

/**
 * Up to two uppercase initials from the resolved name, for avatar fallbacks.
 * Returns null when no name can be resolved so callers can apply their own
 * default (e.g. "U").
 */
export function resolveMemberInitials(member, user) {
  const name = resolveMemberName(member, user);
  if (!name) return null;
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return null;
  return parts.slice(0, 2).map((p) => p[0]).join('').toUpperCase() || null;
}

/**
 * Resolve ANOTHER member's display name from their own record fields, for
 * discovery / recommendation / search cards. Priority:
 *
 *   1. display_name   — user-chosen public name (always safe to show)
 *   2. first + last   — combined when both exist
 *   3. first | last   — whichever exists alone
 *   4. null           — caller applies MEMBER_NAME_FALLBACK
 *
 * Unlike resolveMemberName, this never falls back to the viewer's own
 * user.full_name — it is for other members only, and returns null (not a
 * generic label) when no name data exists so the caller can apply a
 * graceful fallback.
 */
export function resolveDisplayName(member) {
  if (!member) return null;
  const dn = typeof member.display_name === 'string' ? member.display_name.trim() : '';
  if (dn) return dn;
  const first = typeof member.first_name === 'string' ? member.first_name.trim() : '';
  const last = typeof member.last_name === 'string' ? member.last_name.trim() : '';
  if (first && last) return `${first} ${last}`;
  if (first) return first;
  if (last) return last;
  return null;
}

/**
 * Graceful fallback shown only when a member record truly has no name data
 * (rare — display_name is required on the Member entity). Warmer than the
 * generic "Member" label that was shown before.
 */
export const MEMBER_NAME_FALLBACK = 'Someone new';

/**
 * Resolve the subtitle line for a member discovery / recommendation card.
 * Freshness-first: a member who joined within the last 3 days shows
 * "New member" exclusively. Once older, the card shows their city when one
 * exists. When neither applies, returns { kind: null } so the caller hides
 * the subtitle line entirely — the two signals never mix in one line.
 *
 * Based on the member/account creation date (created_date, falling back to
 * joined_at). Returns one of:
 *   { kind: 'new' }              — render the "New member" label
 *   { kind: 'location', label } — render the city
 *   { kind: null }               — hide the subtitle
 */
export function memberSubtitle(member) {
  if (!member) return { kind: null };
  const created = member.created_date || member.joined_at;
  if (created) {
    const ts = new Date(created).getTime();
    if (!isNaN(ts) && (Date.now() - ts) / 86400000 <= 3) {
      return { kind: 'new' };
    }
  }
  const city = typeof member.city === 'string' ? member.city.trim() : '';
  if (city) return { kind: 'location', label: city };
  return { kind: null };
}