// SEC-001 Centralized Security Manager — threat detection, policy enforcement,
// incident recording, risk scoring, and security reporting. Read-only w.r.t.
// business logic; never mutates user data.
import { base44 } from '@/api/base44Client';
import { detectInjection } from './input-validation';

const SENSITIVE_KEYS = [
  'password', 'token', 'secret', 'apikey', 'api_key', 'authorization',
  'card', 'cvv', 'receipt', 'private_key', 'session', 'otp',
];

// Sanitize any object before logging/auditing so private data is never exposed.
export function redactPrivate(obj) {
  if (obj == null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(redactPrivate);
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.some((s) => k.toLowerCase().includes(s))) out[k] = '[REDACTED]';
    else if (k === 'email' || k === 'phone') out[k] = v ? '[PROTECTED]' : '';
    else if (typeof v === 'object') out[k] = redactPrivate(v);
    else out[k] = v;
  }
  return out;
}

// Record a security incident (append-only via securityOps).
export async function recordSecurityEvent({ category, risk = 'informational', action, actionTaken = 'logged', details = '', actor } = {}) {
  try {
    await base44.functions.invoke('securityOps', {
      mode: 'recordEvent',
      category, risk_level: risk, action,
      action_taken: actionTaken,
      details: typeof details === 'string' ? details : JSON.stringify(redactPrivate(details)).slice(0, 1800),
      actor,
    });
  } catch { /* security logging must never break the calling flow */ }
}

// Spam heuristic — flags repeated links, excessive caps, or flood text.
export function detectSpam(text) {
  if (!text) return false;
  const s = String(text);
  const links = (s.match(/https?:\/\//gi) || []).length;
  const caps = s.replace(/[^A-Z]/g, '').length;
  const total = s.replace(/\s/g, '').length || 1;
  if (links > 3) return true;
  if (caps / total > 0.6 && total > 20) return true;
  if (/(.)\1{9,}/.test(s)) return true; // char flooding
  return false;
}

// Threat score for an actor based on recent event categories.
export function scoreRisk(events = []) {
  const weights = { informational: 1, low: 3, medium: 7, high: 15, critical: 40 };
  return events.reduce((sum, e) => sum + (weights[e.risk_level] || 0), 0);
}

// --- OWASP Top 10 compliance findings ---
export const OWASP_FINDINGS = [
  { id: 'A01', title: 'Broken Access Control', status: 'compliant', detail: 'Role-gated admin routes (AdminRoute), authorizationGate backend, entity row-level security enforced server-side.' },
  { id: 'A02', title: 'Cryptographic Failures', status: 'compliant', detail: 'Platform-managed auth tokens; secrets stored server-side only; no plaintext secrets in client bundle.' },
  { id: 'A03', title: 'Injection', status: 'compliant', detail: 'Input validation (input-validation.js); Base44 SDK uses parameterized queries; no raw SQL/NoSQL constructed.' },
  { id: 'A04', title: 'Insecure Design', status: 'review', detail: 'Threat modeling via SecurityManager; rate limiting; defense-in-depth layers. Periodic review recommended.' },
  { id: 'A05', title: 'Security Misconfiguration', status: 'compliant', detail: 'Secure headers (CSP/XCTO/Referrer/Permissions) applied; no debug endpoints in production; error redaction.' },
  { id: 'A06', title: 'Vulnerable Components', status: 'review', detail: 'Dependencies pinned with semver; automated dependency audit recommended before each release.' },
  { id: 'A07', title: 'Authentication Failures', status: 'compliant', detail: 'auth-throttle lockout; atomic session purge on logout; OTP verification flows.' },
  { id: 'A08', title: 'Software & Data Integrity Failures', status: 'compliant', detail: 'Server-driven feature flags; receipt validation server-side; append-only audit logs.' },
  { id: 'A09', title: 'Logging & Monitoring Failures', status: 'compliant', detail: 'Structured logger, error-reporter, AuditLog, and SecurityEvent monitoring in place.' },
  { id: 'A10', title: 'Server-Side Request Forgery', status: 'compliant', detail: 'No arbitrary outbound URL handling from user input; backend fetches limited to known hosts.' },
];

export function buildOwaspReport() {
  const compliant = OWASP_FINDINGS.filter((f) => f.status === 'compliant').length;
  return {
    type: 'OWASP Compliance Report',
    total: OWASP_FINDINGS.length,
    compliant,
    review: OWASP_FINDINGS.filter((f) => f.status === 'review').length,
    items: OWASP_FINDINGS,
    generated_at: new Date().toISOString(),
  };
}

export function buildRiskAssessment(dashboard) {
  return {
    type: 'Risk Assessment',
    security_score: dashboard?.security_score,
    threat_level: dashboard?.threat_level,
    failed_logins_24h: dashboard?.failed_logins_24h,
    blocked_requests: dashboard?.blocked_requests,
    security_alerts: dashboard?.security_alerts,
    recommendation: dashboard?.threat_level === 'critical' || dashboard?.threat_level === 'high'
      ? 'Elevated threat — review latest incidents immediately.'
      : 'Acceptable posture — continue monitoring.',
    generated_at: new Date().toISOString(),
  };
}

export function buildDailySummary(dashboard) {
  return {
    type: 'Daily Security Summary',
    date: new Date().toISOString().slice(0, 10),
    security_score: dashboard?.security_score,
    threat_level: dashboard?.threat_level,
    metrics: {
      failed_logins: dashboard?.failed_logins_24h,
      blocked_requests: dashboard?.blocked_requests,
      rate_limit_events: dashboard?.rate_limit_events,
      suspicious_accounts: dashboard?.suspicious_accounts,
      spam_detections: dashboard?.spam_detection,
      upload_rejections: dashboard?.upload_rejections,
      security_alerts: dashboard?.security_alerts,
    },
    generated_at: new Date().toISOString(),
  };
}

export function buildIncidentReport(incidents = []) {
  return {
    type: 'Incident Report',
    count: incidents.length,
    incidents: incidents.map((i) => ({ ts: i.created_date, actor: i.actor, risk: i.risk_level, category: i.category, action: i.action, details: i.details })),
    generated_at: new Date().toISOString(),
  };
}

export function buildAbuseReport(incidents = []) {
  const abuse = incidents.filter((i) => ['spam', 'abuse', 'bot_detection', 'suspicious_account', 'rate_limit'].includes(i.category));
  return {
    type: 'Abuse Report',
    count: abuse.length,
    incidents: abuse,
    generated_at: new Date().toISOString(),
  };
}

// Detect injection in user input and record a security event when found.
export function screenInput(text, { category = 'blocked_request', actor } = {}) {
  const inj = detectInjection(text);
  if (inj) {
    recordSecurityEvent({ category, risk: 'medium', action: `blocked_${inj}_injection`, details: `Injection pattern detected: ${inj}`, actor });
    return { ok: false, reason: inj };
  }
  return { ok: true };
}