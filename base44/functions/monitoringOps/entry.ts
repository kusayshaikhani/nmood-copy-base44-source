import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// MON-001 Production observability — aggregates metrics, detects anomalies,
// generates alerts, and serves the Observability Center dashboard. Admin-only.
// Reuses existing ErrorLog, PerformanceMetric, ProductEvent, SecurityEvent data.

const ADMIN_MODES = ['dashboard', 'timeline', 'acknowledge', 'resolve', 'listAlerts'];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const mode = body.mode || 'dashboard';
    if (ADMIN_MODES.includes(mode)) {
      const user = await base44.auth.me().catch(() => null);
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    const svc = base44.asServiceRole;
    switch (mode) {
      case 'dashboard': return await dashboard(svc);
      case 'timeline': return await timeline(svc, body);
      case 'acknowledge': return await ackAlert(svc, body);
      case 'resolve': return await resolveAlert(svc, body);
      case 'listAlerts': return await listAlerts(svc, body);
      default: return Response.json({ error: 'Unknown mode' }, { status: 400 });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

const DAY = 24 * 3600 * 1000;

async function dashboard(svc) {
  const now = Date.now();
  const since = now - DAY;
  const [errs, metrics, events, security, alerts] = await Promise.all([
    svc.entities.ErrorLog.list('-created_date', 500),
    svc.entities.PerformanceMetric.list('-created_date', 500),
    svc.entities.ProductEvent.list('-created_date', 500),
    svc.entities.SecurityEvent.list('-created_date', 200),
    svc.entities.ObservabilityAlert.list('-created_date', 200),
  ]);
  const in24 = (e) => e.created_date && new Date(e.created_date).getTime() >= since;

  const err24 = (errs || []).filter(in24);
  const met24 = (metrics || []).filter(in24);
  const ev24 = (events || []).filter(in24);
  const sec24 = (security || []).filter(in24);
  const openAlerts = (alerts || []).filter((a) => a.status !== 'resolved');

  const failed = met24.filter((m) => m.metric_name === 'failed_request').length;
  const total = met24.length || 1;
  const errorRate = Math.round((failed / total) * 1000) / 10;

  const lat = met24.filter((m) => ['api_latency', 'home_load', 'app_startup', 'db_query', 'search_response'].includes(m.metric_name));
  const avgLatency = lat.length ? Math.round(lat.reduce((s, m) => s + (m.duration_ms || 0), 0) / lat.length) : 0;

  const byMetric = {};
  for (const m of lat) {
    const k = m.metric_name + (m.screen ? `:${m.screen}` : '');
    if (!byMetric[k]) byMetric[k] = { metric: m.metric_name, screen: m.screen, total: 0, count: 0 };
    byMetric[k].total += m.duration_ms || 0;
    byMetric[k].count++;
  }
  const slowest = Object.values(byMetric).map((v) => ({ metric: v.metric, screen: v.screen, avg_ms: Math.round(v.total / v.count) })).sort((a, b) => b.avg_ms - a.avg_ms).slice(0, 6);

  const errMap = {};
  for (const e of err24) {
    const key = (e.message || 'Unknown').slice(0, 120);
    if (!errMap[key]) errMap[key] = { message: key, count: 0, severity: e.severity };
    errMap[key].count++;
  }
  const topErrors = Object.values(errMap).sort((a, b) => b.count - a.count).slice(0, 8);

  const bizMap = {};
  for (const e of ev24) { bizMap[e.category] = (bizMap[e.category] || 0) + 1; }

  const criticalOpen = openAlerts.filter((a) => a.level === 'critical').length;
  const highOpen = openAlerts.filter((a) => a.level === 'high').length;
  let status = 'operational';
  if (errorRate > 40 || criticalOpen > 0) status = 'major_outage';
  else if (errorRate > 15 || highOpen > 0) status = 'partial_outage';
  else if (errorRate > 5 || openAlerts.length > 0) status = 'degraded';

  const availability = Math.max(0, Math.round((100 - errorRate) * 10) / 10);

  const hourAgo = now - 3600 * 1000;
  const err1h = err24.filter((e) => new Date(e.created_date).getTime() >= hourAgo).length;
  const err23h = err24.length - err1h;
  const errBaseline = err23h / 23;
  const lat1h = lat.filter((m) => new Date(m.created_date).getTime() >= hourAgo);
  const lat1hAvg = lat1h.length ? lat1h.reduce((s, m) => s + (m.duration_ms || 0), 0) / lat1h.length : 0;
  const lat23h = lat.filter((m) => new Date(m.created_date).getTime() < hourAgo);
  const latBaseline = lat23h.length ? lat23h.reduce((s, m) => s + (m.duration_ms || 0), 0) / lat23h.length : 0;
  const failLogins1h = sec24.filter((e) => e.category === 'auth_failure' && new Date(e.created_date).getTime() >= hourAgo).length;
  const failLogins23h = sec24.filter((e) => e.category === 'auth_failure' && new Date(e.created_date).getTime() < hourAgo).length;
  const flBaseline = failLogins23h / 23;

  const newAlerts = [];
  const upsertAlert = async (alert_id, level, title, metric, value, threshold) => {
    const existing = (alerts || []).find((a) => a.alert_id === alert_id && a.status !== 'resolved');
    if (existing) return;
    newAlerts.push({ alert_id, level, title, metric, value: String(value), threshold: String(threshold) });
    await svc.entities.ObservabilityAlert.create({ alert_id, level, title, metric, value: String(value), threshold: String(threshold), status: 'open' });
  };
  if (errBaseline > 0 && err1h > errBaseline * 3) await upsertAlert('error_spike', 'high', 'Error rate spike detected', 'errors_1h', err1h, `${errBaseline.toFixed(1)}/h`);
  if (latBaseline > 0 && lat1hAvg > latBaseline * 1.5) await upsertAlert('latency_spike', 'warning', 'Latency increase detected', 'api_latency_1h', `${Math.round(lat1hAvg)}ms`, `${Math.round(latBaseline)}ms`);
  if (flBaseline > 0 && failLogins1h > flBaseline * 3) await upsertAlert('failed_login_spike', 'high', 'Failed login spike', 'failed_logins_1h', failLogins1h, `${flBaseline.toFixed(1)}/h`);

  const incidents = [
    ...err24.slice(0, 10).map((e) => ({ ts: e.created_date, type: 'error', severity: e.severity, title: (e.message || '').slice(0, 100), screen: e.screen })),
    ...(alerts || []).slice(0, 10).map((a) => ({ ts: a.created_date, type: 'alert', severity: a.level, title: a.title, status: a.status })),
  ].sort((a, b) => new Date(b.ts) - new Date(a.ts)).slice(0, 15);

  return Response.json({
    status,
    availability,
    error_rate: errorRate,
    avg_response_time: avgLatency,
    total_requests_24h: total,
    failed_requests_24h: failed,
    slowest_services: slowest,
    top_errors: topErrors,
    business_activity: bizMap,
    open_alerts: openAlerts.length,
    recent_alerts: openAlerts.slice(0, 8),
    new_alerts: newAlerts,
    incident_timeline: incidents,
    metrics: {
      errors: err24.length,
      performance_samples: met24.length,
      product_events: ev24.length,
      security_events: sec24.length,
    },
    generated_at: new Date().toISOString(),
  });
}

async function timeline(svc, body) {
  const range = body.range || '24h';
  const days = range === '30d' ? 30 : range === '7d' ? 7 : 1;
  const since = Date.now() - days * DAY;
  const errs = (await svc.entities.ErrorLog.list('-created_date', 1000)).filter((e) => e.created_date && new Date(e.created_date).getTime() >= since);
  const metrics = (await svc.entities.PerformanceMetric.list('-created_date', 1000)).filter((e) => e.created_date && new Date(e.created_date).getTime() >= since);
  const bucketMs = days === 1 ? 3600 * 1000 : DAY;
  const buckets = {};
  for (const e of errs) {
    const b = Math.floor(new Date(e.created_date).getTime() / bucketMs) * bucketMs;
    if (!buckets[b]) buckets[b] = { ts: b, errors: 0, latency: 0, latCount: 0 };
    buckets[b].errors++;
  }
  for (const m of metrics) {
    if (!['api_latency', 'home_load', 'db_query'].includes(m.metric_name)) continue;
    const b = Math.floor(new Date(m.created_date).getTime() / bucketMs) * bucketMs;
    if (!buckets[b]) buckets[b] = { ts: b, errors: 0, latency: 0, latCount: 0 };
    buckets[b].latency += m.duration_ms || 0;
    buckets[b].latCount++;
  }
  const series = Object.values(buckets).sort((a, b) => a.ts - b.ts).map((b) => ({ ts: new Date(b.ts).toISOString(), errors: b.errors, avg_latency: b.latCount ? Math.round(b.latency / b.latCount) : 0 }));
  return Response.json({ range, series });
}

async function ackAlert(svc, body) {
  const user = await base44.auth.me().catch(() => null);
  const list = await svc.entities.ObservabilityAlert.list('-created_date', 500);
  const a = list.find((x) => x.id === body.id);
  if (!a) return Response.json({ error: 'Not found' }, { status: 404 });
  await svc.entities.ObservabilityAlert.update(a.id, { status: 'acknowledged', acknowledged_by: user?.email || 'admin' });
  return Response.json({ ok: true });
}

async function resolveAlert(svc, body) {
  const list = await svc.entities.ObservabilityAlert.list('-created_date', 500);
  const a = list.find((x) => x.id === body.id);
  if (!a) return Response.json({ error: 'Not found' }, { status: 404 });
  await svc.entities.ObservabilityAlert.update(a.id, { status: 'resolved', resolved_at: new Date().toISOString() });
  return Response.json({ ok: true });
}

async function listAlerts(svc, body) {
  const list = await svc.entities.ObservabilityAlert.list('-created_date', body.limit || 100);
  return Response.json({ data: list || [] });
}