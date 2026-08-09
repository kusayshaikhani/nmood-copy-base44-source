import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Admin-only, privacy-by-design product analytics aggregator.
// Returns AGGREGATES ONLY — no personal data, messages, or profiles.
const DAY = 86400000;
const dayKey = (d) => new Date(d).toISOString().slice(0, 10);

const PROFILE_CHECKS = [
  { key: 'display_name', min: 1 },
  { key: 'date_of_birth', min: 1 },
  { key: 'gender', min: 1 },
  { key: 'country', min: 1 },
  { key: 'city', min: 1 },
  { key: 'languages', min: 1, array: true },
  { key: 'interests', min: 3, array: true },
  { key: 'bio', min: 1 },
  { key: 'photo_url', min: 1 },
  { key: 'lifestyle', min: 1 },
];

function completeness(member) {
  if (!member) return 0;
  let filled = 0;
  for (const c of PROFILE_CHECKS) {
    const val = member[c.key];
    const len = Array.isArray(val) ? val.length : (val ? String(val).trim().length : 0);
    if (len >= c.min) filled++;
  }
  return Math.round((filled / PROFILE_CHECKS.length) * 100);
}

function aggregate(items, key) {
  const map = {};
  for (const it of items || []) {
    const v = it[key];
    if (!v) continue;
    if (Array.isArray(v)) { for (const s of v) if (s) map[s] = (map[s] || 0) + 1; }
    else map[v] = (map[v] || 0) + 1;
  }
  return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const svc = base44.asServiceRole;
    const [members, experiences, circles, connections, memberships, events] = await Promise.all([
      svc.entities.Member.list('-created_date', 500),
      svc.entities.Experience.list('-created_date', 500),
      svc.entities.Circle.list('-created_date', 500),
      svc.entities.PalConnection.list('-created_date', 500),
      svc.entities.Membership.list('-created_date', 500),
      svc.entities.ProductEvent.list('-created_date', 1000),
    ]);

    const now = Date.now();
    const memberArr = members || [];
    const expArr = experiences || [];
    const circleArr = circles || [];
    const connArr = (connections || []).filter((c) => c.is_active !== false);
    const membArr = memberships || [];
    const evtArr = events || [];

    // Per-user activity from anonymous product events (created_by_id is the only identifier used).
    const activity = {};
    for (const e of evtArr) {
      const uid = e.created_by_id;
      if (!uid || !e.created_date) continue;
      const t = new Date(e.created_date).getTime();
      const a = activity[uid] || (activity[uid] = { first: t, last: t, days: new Set([dayKey(t)]) });
      if (t < a.first) a.first = t;
      if (t > a.last) a.last = t;
      a.days.add(dayKey(t));
    }

    const activeSince = (days) => {
      const cut = now - days * DAY;
      let count = 0;
      for (const uid in activity) if (activity[uid].last >= cut) count++;
      return count;
    };
    const dau = activeSince(1);
    const wau = activeSince(7);
    const mau = activeSince(30);

    const cohortRetention = (offset) => {
      const cut = now - offset * DAY;
      let cohort = 0, retained = 0;
      for (const uid in activity) {
        const a = activity[uid];
        if (a.first <= cut) {
          cohort++;
          const lo = a.first + (offset - 1) * DAY;
          const hi = a.first + (offset + 1) * DAY;
          for (const d of a.days) {
            const dt = new Date(d).getTime();
            if (dt >= lo && dt <= hi) { retained++; break; }
          }
        }
      }
      return cohort > 0 ? Math.round((retained / cohort) * 100) : null;
    };

    const regCompleted = evtArr.filter((e) => e.event_name === 'Registration Completed').length;
    const premiumCount = membArr.filter((m) => m.type === 'premium').length;
    const totalMembers = memberArr.length;
    const conversion = totalMembers > 0 ? Math.round((premiumCount / totalMembers) * 100) : 0;

    let compSum = 0;
    for (const m of memberArr) compSum += completeness(m);
    const avgCompletion = totalMembers > 0 ? Math.round(compSum / totalMembers) : 0;

    return Response.json({
      totals: {
        totalMembers,
        activeMembers30d: mau,
        newRegistrations: regCompleted,
        experiencesCreated: expArr.length,
        circlesCreated: circleArr.length,
        connectionsMade: connArr.length,
        avgProfileCompletion: avgCompletion,
        membershipConversion: conversion,
      },
      retention: {
        dau, wau, mau,
        retention1d: cohortRetention(1),
        retention7d: cohortRetention(7),
        retention30d: cohortRetention(30),
      },
      topCategories: aggregate(expArr, 'category').slice(0, 6),
      popularInterests: aggregate(memberArr, 'interests').slice(0, 8),
      eventCounts: aggregate(evtArr, 'event_name').slice(0, 30),
      privacy: 'Aggregate only. No personal conversations, private messages, or member identifiers are exposed.',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});