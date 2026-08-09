/**
 * FM-010 — Business Intelligence metrics.
 * Pure functions deriving every BI section from the raw payload returned by
 * the adminConsole `biData` mode. No side effects; safe to memoize client-side.
 *
 * Live where data exists; future-only signals return null so the UI can mark
 * them "Coming Soon" (revenue intelligence, translation management, telemetry).
 */
const DAY = 86400000;

export const dayKey = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');
export const shortDate = (ms) => new Date(ms).toLocaleDateString('en', { month: 'short', day: 'numeric' });

// Release 1.0 — RTL language tracking removed (LTR-only).

export const safe = (x) => (Array.isArray(x) ? x : []);

function countBy(arr, field) {
  const counts = {};
  for (const x of arr) {
    const v = x?.[field];
    if (v) counts[v] = (counts[v] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}
const top = (arr) => (arr.length ? arr[0] : null);

function dayBuckets(days) {
  const now = Date.now();
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const ms = now - i * DAY;
    out.push({ key: dayKey(ms), label: shortDate(ms) });
  }
  return out;
}
function weekBuckets(weeks) {
  const now = Date.now();
  const out = [];
  const start = now - (weeks - 1) * 7 * DAY;
  for (let i = 0; i < weeks; i++) {
    const s = start + i * 7 * DAY;
    out.push({ start: s, end: s + 7 * DAY, label: 'W' + (i + 1) });
  }
  return out;
}
function monthBuckets(months) {
  const now = new Date();
  const out = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const e = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    out.push({ start: d.getTime(), end: e.getTime(), label: d.toLocaleDateString('en', { month: 'short', year: '2-digit' }) });
  }
  return out;
}
function bucketIdx(buckets, t) {
  if (!Number.isFinite(t)) return -1;
  for (let i = 0; i < buckets.length; i++) {
    if (buckets[i].key) { if (dayKey(t) === buckets[i].key) return i; }
    else if (t >= buckets[i].start && t < buckets[i].end) return i;
  }
  return -1;
}
function seriesFor(items, field, buckets) {
  const counts = new Array(buckets.length).fill(0);
  for (const it of items) {
    if (!it[field]) continue;
    const i = bucketIdx(buckets, new Date(it[field]).getTime());
    if (i >= 0) counts[i]++;
  }
  return counts;
}

export function computeOverview(d) {
  const members = safe(d?.members);
  const exp = safe(d?.experiences);
  const circ = safe(d?.circles);
  const memb = safe(d?.memberships);
  const conn = safe(d?.connections);
  const msgs = safe(d?.messages);
  const events = safe(d?.events);
  const now = Date.now();
  const todayK = dayKey(now);
  const activeSince = (since) => {
    const s = new Set();
    for (const e of events) {
      if (e.created_date && new Date(e.created_date).getTime() >= since && e.created_by_id) s.add(e.created_by_id);
    }
    return s;
  };
  return {
    totalMembers: members.length,
    activeMembers: members.filter((m) => (m.admin_status || 'active') === 'active').length,
    dau: activeSince(now - DAY).size,
    wau: activeSince(now - 7 * DAY).size,
    mau: activeSince(now - 30 * DAY).size,
    newToday: members.filter((m) => dayKey(m.created_date) === todayK).length,
    premium: memb.filter((m) => m.type === 'premium' && m.status === 'active').length,
    explorer: memb.filter((m) => m.type === 'explorer').length,
    totalExperiences: exp.length,
    totalCircles: circ.length,
    totalConnections: conn.length,
    totalMessages: msgs.length,
  };
}

export function computeGrowth(d, days = 30) {
  const members = safe(d?.members);
  const exp = safe(d?.experiences);
  const circ = safe(d?.circles);
  const conn = safe(d?.connections);
  const msgs = safe(d?.messages);
  const events = safe(d?.events);
  const now = Date.now();

  const dailyBk = dayBuckets(days);
  const weekBk = weekBuckets(Math.min(12, Math.max(1, Math.ceil(days / 7))));
  const monthBk = monthBuckets(12);

  const mD = seriesFor(members, 'created_date', dailyBk);
  const eD = seriesFor(exp, 'created_date', dailyBk);
  const cD = seriesFor(circ, 'created_date', dailyBk);
  const coD = seriesFor(conn, 'created_date', dailyBk);
  const msgD = seriesFor(msgs, 'created_date', dailyBk);

  let cm = 0, ce = 0, cc = 0;
  const daily = dailyBk.map((b, i) => {
    cm += mD[i]; ce += eD[i]; cc += cD[i];
    return {
      label: b.label,
      members: mD[i], experiences: eD[i], circles: cD[i], connections: coD[i], messages: msgD[i],
      cumulativeMembers: cm, cumulativeExperiences: ce, cumulativeCircles: cc,
    };
  });

  const build = (bk) => {
    const ms = seriesFor(members, 'created_date', bk);
    const es = seriesFor(exp, 'created_date', bk);
    const cs = seriesFor(circ, 'created_date', bk);
    const cos = seriesFor(conn, 'created_date', bk);
    return bk.map((b, i) => ({
      label: b.label,
      members: ms[i], experiences: es[i], circles: cs[i], connections: cos[i],
    }));
  };

  const weekly = build(weekBk);
  const monthly = build(monthBk);

  const half = Math.floor(days / 2);
  const cur = mD.slice(half).reduce((a, b) => a + b, 0);
  const prev = mD.slice(0, half).reduce((a, b) => a + b, 0);
  const deltaPct = prev ? Math.round(((cur - prev) / prev) * 100) : cur ? 100 : 0;

  const activeLast7 = new Set();
  const activeLast30 = new Set();
  for (const e of events) {
    if (!e.created_date || !e.created_by_id) continue;
    const t = new Date(e.created_date).getTime();
    if (t >= now - 7 * DAY) activeLast7.add(e.created_by_id);
    if (t >= now - 30 * DAY) activeLast30.add(e.created_by_id);
  }
  const joined7plus = members.filter((m) => m.created_date && new Date(m.created_date).getTime() <= now - 7 * DAY);
  const retained = joined7plus.filter((m) => m.created_by_id && activeLast7.has(m.created_by_id)).length;
  const retentionRate = joined7plus.length ? Math.round((retained / joined7plus.length) * 100) : null;
  const churnRate = members.length ? Math.round((1 - activeLast30.size / members.length) * 100) : null;

  return {
    daily, weekly, monthly,
    acquisition: daily.map((b) => ({ label: b.label, value: b.members })),
    cur, prev, deltaPct,
    retentionRate, churnRate,
  };
}

export function computeMembership(d) {
  const memb = safe(d?.memberships);
  const now = Date.now();
  const premium = memb.filter((m) => m.type === 'premium' && m.status === 'active').length;
  const explorer = memb.filter((m) => m.type === 'explorer').length;
  const total = premium + explorer;
  const conversionRate = total ? Math.round((premium / total) * 100) : 0;
  const weekAgo = now - 7 * DAY;
  const twoWeek = now - 14 * DAY;
  const upThis = memb.filter((m) => m.type === 'premium' && m.started_date && new Date(m.started_date).getTime() >= weekAgo).length;
  const upLast = memb.filter((m) => m.type === 'premium' && m.started_date && new Date(m.started_date).getTime() >= twoWeek && new Date(m.started_date).getTime() < weekAgo).length;
  const downThis = memb.filter((m) => (m.status === 'cancelled' || m.status === 'expired') && m.updated_date && new Date(m.updated_date).getTime() >= weekAgo).length;
  const renewals = memb.filter((m) => m.type === 'premium' && m.status === 'active' && m.renewal_date).length;
  const renewalRate = premium ? Math.round((renewals / premium) * 100) : 0;
  return {
    premium, explorer, conversionRate,
    upgradeTrend: upThis, upgradePrev: upLast, downgradeTrend: downThis,
    renewalRate, trialConversions: null,
    distribution: [{ name: 'Premium', value: premium }, { name: 'Explorer', value: explorer }],
  };
}

export function computeEngagement(d) {
  const msgs = safe(d?.messages);
  const conn = safe(d?.connections);
  const att = safe(d?.attendances);
  const cmem = safe(d?.circleMemberships);
  const cchat = safe(d?.circleChats);
  const exp = safe(d?.experiences);
  const completed = exp.filter((e) => e.status === 'completed').length;
  const buckets = dayBuckets(14);
  const idx = new Map(buckets.map((b, i) => [b.key, i]));
  const trend = buckets.map((b) => ({ label: b.label, value: 0 }));
  for (const m of msgs) {
    const i = idx.get(dayKey(m.created_date));
    if (i !== undefined) trend[i].value++;
  }
  return {
    messagesSent: msgs.length,
    connectionsCreated: conn.length,
    experiencesJoined: att.length,
    experiencesCompleted: completed,
    circlesJoined: cmem.length,
    circleActivity: cchat.length,
    sessionDuration: null,
    dailyEngagementScore: null,
    trend,
  };
}

export function computeGeographic(d) {
  const members = safe(d?.members);
  const events = safe(d?.events);
  const now = Date.now();
  const weekAgo = now - 7 * DAY;
  const recent = members.filter((m) => m.created_date && new Date(m.created_date).getTime() >= weekAgo);
  const activeIds = new Set();
  for (const e of events) {
    if (e.created_date && new Date(e.created_date).getTime() >= weekAgo && e.created_by_id) activeIds.add(e.created_by_id);
  }
  const activeMembers = members.filter((m) => m.created_by_id && activeIds.has(m.created_by_id));
  return {
    byCountry: countBy(members, 'country'),
    byCity: countBy(members, 'city'),
    growthByCountry: countBy(recent, 'country'),
    growthByCity: countBy(recent, 'city'),
    fastestGrowingCountry: top(countBy(recent, 'country')),
    fastestGrowingCity: top(countBy(recent, 'city')),
    activeCountries: new Set(activeMembers.map((m) => m.country).filter(Boolean)).size,
  };
}

export function computeLanguage(d) {
  const members = safe(d?.members);
  const now = Date.now();
  const weekAgo = now - 7 * DAY;
  const lang = {};
  for (const m of members) (m.languages || []).forEach((l) => { lang[l] = (lang[l] || 0) + 1; });
  const preferred = Object.entries(lang).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  const recent = members.filter((m) => m.created_date && new Date(m.created_date).getTime() >= weekAgo);
  const g = {};
  for (const m of recent) (m.languages || []).forEach((l) => { g[l] = (g[l] || 0) + 1; });
  const growth = Object.entries(g).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  return {
    preferred, growth,
    distribution: preferred.map((p) => ({ name: p.name, value: p.count })),
    totalLanguages: preferred.length,
    translationCoverage: null, missingKeys: null, localizationStatus: null,
  };
}

export function computeInterest(d) {
  const members = safe(d?.members);
  const exp = safe(d?.experiences);
  const circ = safe(d?.circles);
  const att = safe(d?.attendances);
  const now = Date.now();
  const monthAgo = now - 30 * DAY;
  const intC = {};
  for (const m of members) (m.interests || []).forEach((i) => { intC[i] = (intC[i] || 0) + 1; });
  const popular = Object.entries(intC).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 10);
  const recentMembers = members.filter((m) => m.created_date && new Date(m.created_date).getTime() >= monthAgo);
  const rInt = {};
  for (const m of recentMembers) (m.interests || []).forEach((i) => { rInt[i] = (rInt[i] || 0) + 1; });
  const fastestGrowing = Object.entries(rInt).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 10);
  const catC = {};
  for (const e of exp) if (e.category) catC[e.category] = (catC[e.category] || 0) + 1;
  const trendingCategories = Object.entries(catC).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 10);
  const joinC = {};
  for (const a of att) { const id = a.experience_id; if (id) joinC[id] = (joinC[id] || 0) + 1; }
  const expMap = new Map(exp.map((e) => [e.id, e]));
  const mostJoined = Object.entries(joinC).map(([id, joins]) => ({ name: expMap.get(id)?.title || 'Untitled', joins })).sort((a, b) => b.joins - a.joins).slice(0, 10);
  const mostActiveCircles = [...circ].sort((a, b) => (b.member_count || 0) - (a.member_count || 0)).slice(0, 10).map((c) => ({ name: c.name, members: c.member_count || 0 }));
  const emergingCommunities = circ.filter((c) => c.created_date && new Date(c.created_date).getTime() >= now - 14 * DAY).slice(0, 10).map((c) => ({ name: c.name, members: c.member_count || 0 }));
  return { popular, fastestGrowing, trendingCategories, mostJoined, mostActiveCircles, emergingCommunities };
}

export function computeInsights(d) {
  const out = [];
  const members = safe(d?.members);
  const exp = safe(d?.experiences);
  const att = safe(d?.attendances);
  const memb = safe(d?.memberships);
  const now = Date.now();
  const monthAgo = now - 30 * DAY;
  const twoMonth = now - 60 * DAY;

  const catThis = {}, catLast = {};
  for (const e of exp) {
    if (!e.created_date) continue;
    const t = new Date(e.created_date).getTime();
    if (t >= monthAgo) catThis[e.category] = (catThis[e.category] || 0) + 1;
    else if (t >= twoMonth) catLast[e.category] = (catLast[e.category] || 0) + 1;
  }
  let bestCat = null, bestPct = 0;
  for (const c of Object.keys(catThis)) {
    const prev = catLast[c] || 0, cur = catThis[c];
    const pct = prev ? Math.round(((cur - prev) / prev) * 100) : cur ? 100 : 0;
    if (pct > bestPct && cur >= 2) { bestPct = pct; bestCat = c; }
  }
  if (bestCat) out.push({ icon: 'TrendingUp', tone: 'success', text: `${bestCat} Experiences have grown by ${bestPct}% this month.` });

  const langThis = {};
  for (const m of members) {
    if (!m.created_date) continue;
    if (new Date(m.created_date).getTime() >= monthAgo) (m.languages || []).forEach((l) => { langThis[l] = (langThis[l] || 0) + 1; });
  }
  // Release 1.0 — Arabic growth insight removed (RTL/Arabic not supported).

  let wk = 0, wd = 0;
  for (const a of att) {
    if (!a.date) continue;
    const day = new Date(a.date).getDay();
    if (day === 0 || day === 6) wk++; else wd++;
  }
  if (wk > wd && wk + wd > 0) out.push({ icon: 'Calendar', tone: 'success', text: 'Weekend Experiences receive the highest attendance.' });

  const premIds = new Set(memb.filter((m) => m.type === 'premium').map((m) => m.user_id).filter(Boolean));
  const premAtt = att.filter((a) => a.created_by_id && premIds.has(a.created_by_id)).length;
  const expAtt = att.length - premAtt;
  const premAvg = premAtt / Math.max(premIds.size, 1);
  const expAvg = expAtt / Math.max(members.length - premIds.size, 1);
  if (expAvg > 0 && premAvg > expAvg * 2) out.push({ icon: 'Crown', tone: 'success', text: `Premium members participate in ${(premAvg / expAvg).toFixed(1)}x more Experiences.` });

  const rInt = {};
  for (const m of members.filter((m) => m.created_date && new Date(m.created_date).getTime() >= monthAgo)) (m.interests || []).forEach((i) => { rInt[i] = (rInt[i] || 0) + 1; });
  const topInt = Object.entries(rInt).sort((a, b) => b[1] - a[1])[0];
  if (topInt) out.push({ icon: 'Sparkles', tone: 'info', text: `${topInt[0]} is the fastest-growing interest this month.` });

  if (!out.length) out.push({ icon: 'Activity', tone: 'neutral', text: 'Platform is operating within normal parameters — no notable trends detected yet.' });
  return out;
}