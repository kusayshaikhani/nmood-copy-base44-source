import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// SEC-001 Security operations — records security events and serves the
// Security Center dashboard. recordEvent is callable by any client (events
// are append-only); dashboard / listEvents require an admin.

const ADMIN_MODES = ['dashboard', 'listEvents'];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const mode = body.mode || 'dashboard';
    const svc = base44.asServiceRole;
    const ip = req.headers.get?.('x-forwarded-for')?.split(',')[0]?.trim() || '';

    let user = null;
    try { user = await base44.auth.me(); } catch {}

    if (mode === 'recordEvent') {
      // recordEvent requires an authenticated session to prevent anonymous log
      // pollution / spoofing. Any logged-in user may report an event.
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    } else if (ADMIN_MODES.includes(mode)) {
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    switch (mode) {
      case 'recordEvent': return await recordEvent(svc, body, user, ip);
      case 'dashboard': return await dashboard(svc);
      case 'listEvents': return await listEvents(svc, body);
      default: return Response.json({ error: 'Unknown mode' }, { status: 400 });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

const RISK = ['informational', 'low', 'medium', 'high', 'critical'];

async function recordEvent(svc, body, user, ip) {
  // Actor is bound to the authenticated identity — clients cannot spoof it.
  // (recordEvent is only reachable when a user session exists; see the
  // dispatcher above.)
  const rec = {
    actor: String(user?.email || user?.id || 'anonymous').slice(0, 200),
    risk_level: RISK.includes(body.risk_level) ? body.risk_level : 'informational',
    category: String(body.category || 'other').slice(0, 80),
    action: String(body.action || 'event').slice(0, 200),
    action_taken: String(body.action_taken || 'logged').slice(0, 120),
    details: String(body.details || '').slice(0, 2000),
    ip_address: ip,
  };
  await svc.entities.SecurityEvent.create(rec);
  return Response.json({ ok: true });
}

async function listEvents(svc, body) {
  const limit = Math.min(Number(body.limit) || 100, 500);
  const items = await svc.entities.SecurityEvent.list('-created_date', limit);
  return Response.json({ data: items || [] });
}

async function dashboard(svc) {
  const items = await svc.entities.SecurityEvent.list('-created_date', 500);
  const arr = items || [];
  const now = Date.now();
  const dayAgo = now - 24 * 3600 * 1000;
  const is24 = (e) => e.created_date && new Date(e.created_date).getTime() >= dayAgo;
  const last24 = arr.filter(is24);

  const countCat = (list, cat) => list.filter((e) => e.category === cat).length;
  const highPlus = (list) => list.filter((e) => ['high', 'critical'].includes(e.risk_level)).length;

  const failedLogins = countCat(last24, 'auth_failure');
  const blockedRequests = countCat(last24, 'blocked_request');
  const rateLimitEvents = countCat(last24, 'rate_limit');
  const suspiciousAccounts = new Set(last24.filter((e) => e.category === 'suspicious_account').map((e) => e.actor)).size;
  const spamDetections = countCat(last24, 'spam');
  const uploadRejections = countCat(last24, 'upload_rejection');
  const securityAlerts = highPlus(last24);

  // Threat level derived from high/critical event volume.
  const critical24 = last24.filter((e) => e.risk_level === 'critical').length;
  let threatLevel = 'low';
  if (critical24 > 0) threatLevel = 'critical';
  else if (securityAlerts > 5) threatLevel = 'high';
  else if (securityAlerts > 0 || rateLimitEvents > 20) threatLevel = 'medium';

  // Security score: start 100, deduct for incidents.
  let score = 100;
  score -= Math.min(40, failedLogins * 2);
  score -= Math.min(30, blockedRequests * 2);
  score -= Math.min(20, spamDetections * 3);
  score -= Math.min(30, critical24 * 10);
  score -= Math.min(20, uploadRejections * 2);
  score = Math.max(0, score);

  const latestIncidents = last24.slice(0, 20);

  return Response.json({
    security_score: score,
    threat_level: threatLevel,
    failed_logins_24h: failedLogins,
    blocked_requests: blockedRequests,
    rate_limit_events: rateLimitEvents,
    suspicious_accounts: suspiciousAccounts,
    spam_detection: spamDetections,
    upload_rejections: uploadRejections,
    security_alerts: securityAlerts,
    latest_incidents: latestIncidents,
    total_events: arr.length,
  });
}