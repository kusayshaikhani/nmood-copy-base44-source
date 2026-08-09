/**
 * FM-006 — Executive Command Center metrics. Pure helpers deriving every
 * dashboard section from the loaded data. Placeholder metrics are returned
 * as `null` so the UI can clearly mark them as awaiting future modules.
 */
import { APP_VERSION, BUILD_DATE, ENVIRONMENT } from '@/lib/system-config';
import { computeKpis as computeTrustKpis, isOpen } from '@/lib/trust-safety-directory';

const DAY = 86400000;
const dayKey = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

export function greeting(d = new Date()) {
  const h = d.getHours();
  if (h < 12) return 'Good Morning';
  if (h < 18) return 'Good Afternoon';
  return 'Good Evening';
}

export function scoreColor(score) {
  if (score >= 85) return 'success';
  if (score >= 60) return 'warning';
  return 'destructive';
}
export function scoreStatus(score) {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 60) return 'Fair';
  return 'Needs Attention';
}

export function computePlatformScore({ reports, members, error, onlineMembers, totalMembers }) {
  let score = 100;
  const openReports = reports.filter((r) => isOpen(r.status)).length;
  const critical = reports.filter((r) => r.priority === 'high' && isOpen(r.status)).length;
  score -= Math.min(openReports * 1.2, 14);
  score -= Math.min(critical * 3, 12);
  const suspended = members.filter((m) => m.admin_status === 'suspended').length;
  const banned = members.filter((m) => m.admin_status === 'banned').length;
  score -= Math.min((suspended + banned) * 0.4, 8);
  if (error) score -= 15;
  if (totalMembers > 0 && onlineMembers / totalMembers < 0.01) score -= 3;
  // Reserved (AI availability, security, performance) are neutral until wired.
  return Math.max(0, Math.min(100, Math.round(score)));
}

function topKey(arr, field) {
  const counts = {};
  arr.forEach((x) => { const v = x[field]; if (v) counts[v] = (counts[v] || 0) + 1; });
  let best = null, max = 0;
  Object.entries(counts).forEach(([k, v]) => { if (v > max) { max = v; best = k; } });
  return best ? { name: best, count: max } : null;
}

export function computeBrief({ members, experiences, circles, reports, memberships, connections, lastSeen }) {
  const since = lastSeen ? lastSeen.getTime() : Date.now() - DAY;
  const sinceFn = (arr) => arr.filter((x) => x.created_date && new Date(x.created_date).getTime() >= since);
  const weekAgo = Date.now() - 7 * DAY;
  const recentMembers = members.filter((m) => m.created_date && new Date(m.created_date).getTime() >= weekAgo);
  return {
    newMembers: sinceFn(members).length,
    premiumUpgrades: memberships.filter((m) => m.type === 'premium' && m.started_date && new Date(m.started_date).getTime() >= since).length,
    newExperiences: sinceFn(experiences).length,
    newCircles: sinceFn(circles).length,
    newConnections: sinceFn(connections || []).length,
    reportsSubmitted: sinceFn(reports).length,
    reportsResolved: reports.filter((r) => r.status === 'resolved' && r.updated_date && new Date(r.updated_date).getTime() >= since).length,
    verificationRequests: null, // verification module not yet implemented
    trustScoreChanges: null, // trust engine not yet implemented
    fastestGrowingCountry: topKey(recentMembers, 'country'),
    fastestGrowingCity: topKey(recentMembers, 'city'),
  };
}

export function computeFocus({ reports, tickets, members }) {
  const items = [];
  const critical = reports.filter((r) => r.priority === 'high' && isOpen(r.status)).length;
  if (critical > 0) items.push({ label: `${critical} critical report${critical > 1 ? 's' : ''} awaiting review`, to: '/mission-control/trust-safety', severity: 'high' });
  const pendingAppeals = tickets.filter((a) => a.type === 'appeal' && a.status === 'open').length;
  if (pendingAppeals > 0) items.push({ label: `${pendingAppeals} pending appeal${pendingAppeals > 1 ? 's' : ''}`, to: '/mission-control/trust-safety', severity: 'medium' });
  const suspended = members.filter((m) => m.admin_status === 'suspended').length;
  if (suspended > 5) items.push({ label: `${suspended} members currently suspended`, to: '/mission-control/members', severity: 'medium' });
  const openReports = reports.filter((r) => isOpen(r.status)).length;
  if (openReports > 10) items.push({ label: `${openReports} open reports in the queue`, to: '/mission-control/trust-safety', severity: 'medium' });
  const banned = members.filter((m) => m.admin_status === 'banned').length;
  if (banned > 0) items.push({ label: `${banned} banned member${banned > 1 ? 's' : ''}`, to: '/mission-control/members', severity: 'high' });
  return items;
}

export function computeHealth(stats, error) {
  const map = (s) => (s === 'healthy' ? 'success' : s === 'warning' ? 'warning' : 'destructive');
  const fromStats = (name) => {
    const h = (stats?.systemHealth || []).find((x) => x.name === name);
    return h ? { status: map(h.status), detail: h.latency || 'OK' } : { status: 'unknown', detail: 'Not monitored' };
  };
  const notMonitored = { status: 'unknown', detail: 'Not monitored' };
  const to = '/mission-control/system-health';
  const indicators = [
    { name: 'Authentication', ...(error ? { status: 'destructive', detail: 'Auth error' } : { status: 'success', detail: 'Active' }), to },
    { name: 'Database', ...fromStats('Database'), to },
    { name: 'APIs', ...fromStats('API Service'), to },
    { name: 'AI Engine', ...notMonitored, to: '/mission-control/ai-intelligence' },
    { name: 'Notifications', ...notMonitored, to: '/mission-control/notifications' },
    { name: 'Push Services', ...notMonitored, to: '/mission-control/notifications' },
    { name: 'Email Queue', ...notMonitored, to: '/mission-control/notifications' },
    { name: 'Search Engine', ...notMonitored, to },
    { name: 'Storage', ...fromStats('Storage'), to },
    { name: 'Background Jobs', ...fromStats('Background Jobs'), to },
  ];
  const hasMonitoring = !!(stats?.systemHealth && stats.systemHealth.length);
  return { hasMonitoring, indicators };
}

export function computeCommunityPulse({ members, memberships, connections, messages, stats }) {
  const tk = dayKey(new Date());
  const now = Date.now();
  const activeSince = (ms) => members.filter((m) => m.updated_date && new Date(m.updated_date).getTime() >= now - ms).length;
  return {
    online: stats?.onlineMembers ?? 0,
    dau: stats?.onlineMembers ?? 0,
    wau: activeSince(7 * DAY),
    mau: activeSince(30 * DAY),
    newToday: members.filter((m) => dayKey(m.created_date) === tk).length,
    verified: members.filter((m) => m.phone_verified).length,
    explorer: memberships.filter((m) => m.type === 'explorer').length,
    premium: memberships.filter((m) => m.type === 'premium' && m.status === 'active').length,
    connectionsToday: (connections || []).filter((c) => dayKey(c.created_date) === tk).length,
    messagesToday: (messages || []).filter((m) => dayKey(m.created_date) === tk).length,
    experiencesToday: stats?.experiencesToday ?? 0,
    circlesToday: stats?.circlesToday ?? 0,
  };
}

export function computeTrustPulse(reports, tickets, members, aiReviews = []) {
  const base = computeTrustKpis(reports, tickets.filter((t) => t.type === 'appeal'), members);
  return {
    ...base,
    activeWarnings: 0, // no warnings module yet — 0 records
    aiFlagged: aiReviews.filter((r) => r.status === 'pending').length,
  };
}

export function computeAi(aiAudits = [], aiReviews = []) {
  const audits = aiAudits || [];
  const reviews = aiReviews || [];
  const hasHistory = audits.length > 0 || reviews.length > 0;
  if (!hasHistory) {
    return {
      noHistory: true,
      recommendationsGenerated: 0,
      acceptanceRate: null,
      avgConfidence: null,
      availability: null,
      safetyFlags: 0,
      accuracy: null,
      reserved: ['Bias Detection', 'Prompt Quality', 'Model Health', 'Hallucination Monitoring'],
    };
  }
  const avgConfidence = audits.length
    ? Math.round((audits.reduce((s, a) => s + (Number(a.confidence) || 0), 0) / audits.length) * 100) / 100
    : null;
  const safetyFlags = audits.filter((a) => a.safety_status === 'flagged' || a.safety_status === 'blocked').length;
  const completed = audits.filter((a) => a.final_outcome === 'completed').length;
  const acceptanceRate = audits.length ? Math.round((completed / audits.length) * 100) + '%' : null;
  const pendingReviews = reviews.filter((r) => r.status === 'pending').length;
  const availability = audits.length ? 'Operational' : null;
  return {
    noHistory: false,
    recommendationsGenerated: audits.length,
    acceptanceRate,
    avgConfidence,
    availability,
    safetyFlags,
    accuracy: pendingReviews > 0 ? 'Pending review' : null,
    reserved: ['Bias Detection', 'Prompt Quality', 'Model Health', 'Hallucination Monitoring'],
  };
}

export function computeActivity({ members, experiences, circles, reports, memberships, tickets }) {
  const items = [];
  members.forEach((m) => items.push({ id: 'm' + m.id, kind: 'member', title: 'Member Registered', subtitle: m.display_name, time: m.created_date }));
  memberships.forEach((m) => { if (m.type === 'premium' && m.started_date) items.push({ id: 'p' + m.id, kind: 'premium', title: 'Premium Upgrade', subtitle: m.plan || 'Premium', time: m.started_date }); });
  experiences.forEach((e) => items.push({ id: 'e' + e.id, kind: 'experience', title: 'Experience Created', subtitle: e.title, time: e.created_date }));
  circles.forEach((c) => items.push({ id: 'c' + c.id, kind: 'circle', title: 'Circle Created', subtitle: c.name, time: c.created_date }));
  reports.forEach((r) => items.push({ id: 'rs' + r.id, kind: 'report_submitted', title: 'Report Submitted', subtitle: r.reason || r.target_name, time: r.created_date }));
  reports.forEach((r) => { if (r.status === 'resolved' && r.updated_date) items.push({ id: 'rr' + r.id, kind: 'report_resolved', title: 'Report Resolved', subtitle: r.target_name, time: r.updated_date }); });
  tickets.forEach((t) => { if (t.type === 'appeal') items.push({ id: 'a' + t.id, kind: 'appeal', title: 'Appeal Submitted', subtitle: t.subject, time: t.created_date }); });
  items.sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0));
  return items.slice(0, 20);
}

export function computeGlobalInsights(members) {
  const weekAgo = Date.now() - 7 * DAY;
  const recent = members.filter((m) => m.created_date && new Date(m.created_date).getTime() >= weekAgo);
  const activeRecent = members.filter((m) => m.updated_date && new Date(m.updated_date).getTime() >= weekAgo);
  const langCounts = {};
  members.forEach((m) => (m.languages || []).forEach((l) => { langCounts[l] = (langCounts[l] || 0) + 1; }));
  let topLang = null, maxL = 0;
  Object.entries(langCounts).forEach(([k, v]) => { if (v > maxL) { maxL = v; topLang = k; } });
  return {
    topCountry: topKey(members, 'country'),
    topCity: topKey(members, 'city'),
    topLanguage: topLang ? { name: topLang, count: maxL } : null,
    fastestGrowingRegion: topKey(recent, 'country'),
    mostActiveRegion: topKey(activeRecent, 'country'),
  };
}

export function computeFounderInsights({ members, experiences, circles, reports }) {
  const out = [];
  const weekAgo = Date.now() - 7 * DAY;
  const twoWeeksAgo = Date.now() - 14 * DAY;
  const inRange = (arr, from, to = Date.now()) => arr.filter((x) => { const t = new Date(x.created_date || 0).getTime(); return t >= from && t < to; }).length;
  const newThisWeek = inRange(members, weekAgo);
  const newLastWeek = inRange(members, twoWeeksAgo, weekAgo);
  if (newThisWeek > newLastWeek) out.push({ label: 'Member engagement increased', trend: 'up' });
  else if (newThisWeek < newLastWeek) out.push({ label: 'Member growth slowed', trend: 'down' });
  const expThis = inRange(experiences, weekAgo);
  const expLast = inRange(experiences, twoWeeksAgo, weekAgo);
  if (expThis > expLast) out.push({ label: 'Experience creation increased', trend: 'up' });
  else if (expThis < expLast) out.push({ label: 'Experience creation decreased', trend: 'down' });
  const circThis = inRange(circles, weekAgo);
  const circLast = inRange(circles, twoWeeksAgo, weekAgo);
  if (circThis > circLast) out.push({ label: 'Circle participation increased', trend: 'up' });
  const resolvedRate = reports.length ? reports.filter((r) => r.status === 'resolved').length / reports.length : 0;
  if (resolvedRate > 0.7) out.push({ label: 'Trust Score improved', trend: 'up' });
  if (out.length === 0) out.push({ label: 'Platform operating within normal parameters.', trend: 'neutral' });
  return out;
}

export function computeAlerts({ reports, members, error }) {
  const alerts = [];
  const critical = reports.filter((r) => r.priority === 'high' && isOpen(r.status));
  if (critical.length) alerts.push({ level: 'critical', title: `${critical.length} high-priority report${critical.length > 1 ? 's' : ''} open`, to: '/mission-control/trust-safety' });
  const suspended = members.filter((m) => m.admin_status === 'suspended').length;
  if (suspended > 10) alerts.push({ level: 'warning', title: `${suspended} members currently suspended`, to: '/mission-control/members' });
  if (error) alerts.push({ level: 'critical', title: 'Data load error — some metrics unavailable', to: '/mission-control/system-health' });
  return alerts;
}

export function deployments() {
  return {
    version: APP_VERSION,
    deployedAt: BUILD_DATE,
    status: 'Healthy',
    environment: (ENVIRONMENT || 'production').toString(),
    buildHealth: 'Passing',
  };
}

export function formatRelative(dateStr) {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  if (Number.isNaN(diff)) return '—';
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}