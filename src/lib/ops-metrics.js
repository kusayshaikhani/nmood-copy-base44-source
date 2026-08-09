/** FM-011 — Platform Operations metrics. Pure functions over the opsCenter payload. */
import { dayKey, safe } from './bi-metrics';

const todayK = () => dayKey(Date.now());

const STATUS_META = {
  healthy: { label: 'Healthy', color: 'success', uptime: '99.9%' },
  warning: { label: 'Warning', color: 'warning', uptime: '99.5%' },
  critical: { label: 'Critical', color: 'destructive', uptime: '98.2%' },
  offline: { label: 'Offline', color: 'muted', uptime: '0%' },
};
export function statusMeta(status) { return STATUS_META[status] || STATUS_META.healthy; }

const SERVICES = [
  { id: 'auth', name: 'Authentication', keywords: ['auth'] },
  { id: 'database', name: 'Database', keywords: ['database', 'db_query'] },
  { id: 'api', name: 'API Gateway', keywords: ['api_latency', 'api', 'failed_request'] },
  { id: 'ai', name: 'AI Engine', keywords: ['ai'] },
  { id: 'notifications', name: 'Notification Services', keywords: ['notification'] },
  { id: 'email', name: 'Email Services', keywords: ['email'] },
  { id: 'push', name: 'Push Services', keywords: ['push'] },
  { id: 'workers', name: 'Background Workers', keywords: ['worker', 'job'] },
  { id: 'queues', name: 'Queues', keywords: ['queue'] },
  { id: 'storage', name: 'Storage', keywords: ['storage'] },
  { id: 'search', name: 'Search', keywords: ['search'] },
  { id: 'media', name: 'Media Services', keywords: ['media'] },
];

function matches(text, keywords) {
  if (!text) return false;
  const t = String(text).toLowerCase();
  return keywords.some((k) => t.includes(k));
}

export function computePlatformOverview(data) {
  const alerts = safe(data?.observabilityAlerts);
  const sec = safe(data?.securityEvents);
  const audit = safe(data?.auditLogs);
  const flags = safe(data?.featureFlags);
  const errs = safe(data?.errorLogs);
  const metrics = safe(data?.performanceMetrics);
  const openAlerts = alerts.filter((a) => a.status === 'open');
  const critical = sec.filter((s) => s.risk_level === 'critical' || s.risk_level === 'high');
  const auditToday = audit.filter((a) => dayKey(a.created_date) === todayK());
  const fatalErrors = errs.filter((e) => e.severity === 'fatal' || e.severity === 'error');
  const failedReq = metrics.filter((m) => m.metric_name === 'failed_request');
  const criticalOpen = openAlerts.filter((a) => a.level === 'critical').length;
  const platformStatus = criticalOpen || critical.length || fatalErrors.length ? 'degraded' : 'operational';
  return {
    platformStatus,
    systemUptime: '99.9%',
    apiAvailability: failedReq.length ? `${Math.max(95, 100 - failedReq.length)}%` : '100%',
    databaseStatus: 'healthy',
    queueStatus: openAlerts.filter((a) => matches(a.metric, ['queue'])).length ? 'congested' : 'idle',
    activeSessions: null,
    failedJobs: failedReq.length,
    securityAlerts: critical.length + openAlerts.length,
    auditEventsToday: auditToday.length,
    enabledFlags: flags.filter((f) => f.enabled).length,
    totalFlags: flags.length,
    errorEvents: errs.length,
  };
}

export function computeSystemHealth(data) {
  const alerts = safe(data?.observabilityAlerts);
  const errs = safe(data?.errorLogs);
  const open = alerts.filter((a) => a.status === 'open');
  return SERVICES.map((s) => {
    const crit = open.filter((a) => a.level === 'critical' && (matches(a.metric, s.keywords) || matches(a.title, s.keywords)));
    const warn = open.filter((a) => matches(a.metric, s.keywords) || matches(a.title, s.keywords));
    const recentErr = errs.filter((e) => matches(e.message, s.keywords) || matches(e.screen, s.keywords));
    let status = 'healthy';
    if (crit.length) status = 'critical';
    else if (warn.length) status = 'warning';
    else if (recentErr.length > 2) status = 'warning';
    return { ...s, status, alerts: warn.length, errors: recentErr.length, uptime: STATUS_META[status].uptime };
  });
}

export function computeSecurity(data) {
  const sec = safe(data?.securityEvents);
  return {
    failedLogins: sec.filter((s) => s.category === 'auth_failure').length,
    suspiciousActivity: sec.filter((s) => ['suspicious_account', 'bot_detection', 'abuse', 'spam'].includes(s.category)).length,
    lockedAccounts: sec.filter((s) => s.category === 'permission_violation').length,
    activeSessions: null,
    deviceStats: null,
    passwordResets: null,
    mfaStatus: null,
    apiSecurityEvents: sec.filter((s) => ['security_config', 'blocked_request', 'rate_limit'].includes(s.category)).length,
    incidents: sec.filter((s) => s.risk_level === 'critical' || s.risk_level === 'high').length,
    events: sec,
  };
}

export function computeApiHealth(data) {
  const metrics = safe(data?.performanceMetrics);
  const sec = safe(data?.securityEvents);
  const byName = {};
  for (const m of metrics) {
    const k = m.metric_name || 'unknown';
    if (!byName[k]) byName[k] = { count: 0, total: 0, max: 0 };
    byName[k].count++;
    byName[k].total += m.duration_ms || 0;
    byName[k].max = Math.max(byName[k].max, m.duration_ms || 0);
  }
  const apiLatency = byName['api_latency'] || { count: 0, total: 0 };
  const avgResponseTime = apiLatency.count ? Math.round(apiLatency.total / apiLatency.count) : 0;
  const failedReq = byName['failed_request']?.count || 0;
  const total = metrics.length || 1;
  const errorRate = Math.round((failedReq / total) * 100);
  const slowEndpoints = Object.entries(byName)
    .map(([name, v]) => ({ name, avg: v.count ? Math.round(v.total / v.count) : 0, max: v.max, count: v.count }))
    .filter((e) => e.avg > 0)
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 8);
  return {
    avgResponseTime,
    errorRate,
    requestVolume: metrics.length,
    slowEndpoints,
    rateLimitHits: sec.filter((s) => s.category === 'rate_limit').length,
  };
}

export function computeConfig(data) {
  const cfg = safe(data?.systemConfig);
  const byCategory = {};
  for (const c of cfg) {
    const k = c.category || 'other';
    if (!byCategory[k]) byCategory[k] = [];
    byCategory[k].push(c);
  }
  return byCategory;
}