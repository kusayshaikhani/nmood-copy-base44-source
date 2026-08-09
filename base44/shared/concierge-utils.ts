// Shared utilities for backend functions that need membership/member resolution.
// Extracted to avoid duplication between authorizationGate and conciergeChat.

export function json(status: number, body: any) {
  return Response.json(body, { status });
}

export function isPremium(m: any): boolean {
  return m && m.type === 'premium' && ['active', 'trial', 'grace_period'].includes(m.status);
}

export async function getMembership(svc: any, userId: string): Promise<any> {
  const rows = await svc.entities.Membership.filter({ user_id: String(userId) }).catch(() => []);
  return rows && rows[0] ? rows[0] : null;
}

// Resolve the member record for a user, preferring onboarded records and
// the earliest created one (mirrors the client getOwnMember helper).
export async function getMember(svc: any, userId: string): Promise<any> {
  const rows = await svc.entities.Member.filter({ created_by_id: String(userId) }).catch(() => []);
  if (!rows || !rows.length) return null;
  const onboarded = rows.filter((r: any) => r.onboarding_completed);
  const pool = onboarded.length ? onboarded : rows;
  return pool.slice().sort((a: any, b: any) =>
    new Date(a.created_date).getTime() - new Date(b.created_date).getTime()
  )[0];
}

// Bidirectional block check: returns true if EITHER side has blocked the other.
export async function isBlockedPair(svc: any, userA: string, userB: string): Promise<boolean> {
  if (!userA || !userB || String(userA) === String(userB)) return false;
  const [a, b] = await Promise.all([
    svc.entities.BlockedMember.filter({ created_by_id: String(userA), blocked_user_id: String(userB) }).catch(() => []),
    svc.entities.BlockedMember.filter({ created_by_id: String(userB), blocked_user_id: String(userA) }).catch(() => []),
  ]);
  return (a && a.length > 0) || (b && b.length > 0);
}

// Resolve a target member by Member entity id or user id (created_by_id).
// Returns the canonical Member record (prefers onboarded, earliest created).
export async function resolveTargetMember(svc: any, id: string): Promise<any> {
  if (!id) return null;
  let m = await svc.entities.Member.get(String(id)).catch(() => null);
  if (m) return m;
  const rows = await svc.entities.Member.filter({ created_by_id: String(id) }).catch(() => []);
  if (!rows || !rows.length) return null;
  const onboarded = rows.filter((r: any) => r.onboarding_completed);
  const pool = onboarded.length ? onboarded : rows;
  return pool.slice().sort((a: any, b: any) =>
    new Date(a.created_date).getTime() - new Date(b.created_date).getTime()
  )[0];
}

// Discovery visibility filter for Circles — excludes demo, hidden, inactive, incomplete.
export function isDiscoveryVisibleCircle(c: any): boolean {
  if (!c) return false;
  if (c.is_demo) return false;
  if (c.is_hidden) return false;
  if (c.status !== 'active') return false;
  if (!c.name) return false;
  return true;
}

// Discovery visibility filter for Experiences — excludes demo, hidden,
// archived, cancelled, completed, incomplete.
export function isDiscoveryVisibleExperience(e: any): boolean {
  if (!e) return false;
  if (e.is_demo) return false;
  if (e.is_hidden || e.is_archived) return false;
  if (e.status === 'cancelled' || e.status === 'completed') return false;
  if (e.status !== 'active') return false;
  if (!e.title) return false;
  return true;
}

// Get the UTC offset (in ms) for a given IANA timezone at a given instant.
// Uses Intl.DateTimeFormat to handle daylight-saving zones correctly.
function getTzOffsetMs(timezone: string, date: Date): number {
  try {
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone || 'UTC',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false,
    });
    const parts = dtf.formatToParts(date);
    const map: Record<string, string> = {};
    for (const p of parts) {
      if (p.type !== 'literal') map[p.type] = p.value;
    }
    const hour = map.hour === '24' ? '0' : map.hour;
    const asUTC = Date.UTC(
      parseInt(map.year, 10), parseInt(map.month, 10) - 1, parseInt(map.day, 10),
      parseInt(hour, 10), parseInt(map.minute, 10), parseInt(map.second, 10)
    );
    return asUTC - date.getTime();
  } catch {
    return 0;
  }
}

// Convert an Experience's local date+time+timezone to a UTC Date.
// Returns null if the date is missing or invalid.
export function experienceStartUtc(e: any): Date | null {
  if (!e || !e.date) return null;
  const timeStr = (e.time || '00:00').padStart(5, '0').slice(0, 5);
  const tz = e.timezone || 'Asia/Dubai';
  const utcGuess = new Date(`${e.date}T${timeStr}:00.000Z`);
  if (isNaN(utcGuess.getTime())) return null;
  const offsetMs = getTzOffsetMs(tz, utcGuess);
  return new Date(utcGuess.getTime() - offsetMs);
}

// Check if an Experience is past (started) using timezone-aware UTC.
export function isExperiencePast(e: any): boolean {
  const start = experienceStartUtc(e);
  if (!start) return false;
  return start.getTime() < Date.now();
}

// SB1D-Circle — Authoritative Circle member-count reconciliation.
// Recalculates Circle.member_count from distinct active (status === 'member')
// canonical member_user_id values and persists it if different. This is the
// single source of truth for member_count — never increment/decrement blindly.
// Returns the authoritative active count. Best-effort: never throws.
export async function recountCircleMembers(svc: any, circleId: string): Promise<number> {
  if (!circleId) return 0;
  try {
    const all = await svc.entities.CircleMembership.filter({ circle_id: String(circleId) }).catch(() => []);
    const active = (all || []).filter((m: any) => m.status === 'member' && m.member_user_id);
    // Distinct canonical member_user_ids — duplicate memberships (race) count once.
    const distinctIds = new Set(active.map((m: any) => String(m.member_user_id)));
    const count = distinctIds.size;
    const circle = await svc.entities.Circle.get(String(circleId)).catch(() => null);
    if (circle && (circle.member_count || 0) !== count) {
      await svc.entities.Circle.update(String(circleId), { member_count: count }).catch(() => {});
    }
    return count;
  } catch {
    return 0;
  }
}