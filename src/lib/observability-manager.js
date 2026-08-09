// MON-001 Centralized Observability Manager — collects metrics, aggregates
// events, detects anomalies, and surfaces operational insights. Monitoring
// only; never mutates business data. Privacy by design: aggregates only, no PII.
import { base44 } from '@/api/base44Client';
import { startTimer, track } from './performance-monitor';
import { trackProductEvent } from './product-analytics';
import { captureError } from './error-reporter';

export { startTimer, track, captureError, trackProductEvent };

// Fetch the Observability Center dashboard (admin-only).
export async function getDashboard() {
  return base44.functions.invoke('monitoringOps', { mode: 'dashboard' });
}

// Fetch a health timeline series (24h | 7d | 30d).
export async function getTimeline(range) {
  return base44.functions.invoke('monitoringOps', { mode: 'timeline', range });
}

export async function acknowledgeAlert(id) {
  return base44.functions.invoke('monitoringOps', { mode: 'acknowledge', id });
}

export async function resolveAlert(id) {
  return base44.functions.invoke('monitoringOps', { mode: 'resolve', id });
}

// --- Report builders (client-side, from dashboard + timeline) ---
export function buildDailyOpsReport(dash) {
  return {
    type: 'Daily Operations Report',
    date: new Date().toISOString().slice(0, 10),
    status: dash?.status,
    availability: dash?.availability,
    error_rate: dash?.error_rate,
    avg_response_time: dash?.avg_response_time,
    metrics: dash?.metrics,
    business_activity: dash?.business_activity,
    open_alerts: dash?.open_alerts,
    generated_at: new Date().toISOString(),
  };
}

export function buildWeeklyHealthReport(dash, timeline) {
  return {
    type: 'Weekly Health Report',
    week: new Date().toISOString().slice(0, 10),
    status: dash?.status,
    availability: dash?.availability,
    timeline_points: timeline?.length || 0,
    total_errors_7d: (timeline || []).reduce((s, p) => s + p.errors, 0),
    avg_latency_7d: timeline?.length ? Math.round(timeline.reduce((s, p) => s + p.avg_latency, 0) / timeline.length) : 0,
    generated_at: new Date().toISOString(),
  };
}

export function buildMonthlyPlatformReport(dash, timeline) {
  return {
    type: 'Monthly Platform Report',
    month: new Date().toISOString().slice(0, 7),
    status: dash?.status,
    availability: dash?.availability,
    business_activity: dash?.business_activity,
    slowest_services: dash?.slowest_services,
    generated_at: new Date().toISOString(),
  };
}

export function buildIncidentSummary(dash) {
  return {
    type: 'Incident Summary',
    incidents: dash?.incident_timeline || [],
    open_alerts: dash?.open_alerts,
    generated_at: new Date().toISOString(),
  };
}

export function buildAvailabilityReport(dash, timeline) {
  return {
    type: 'Availability Report',
    availability: dash?.availability,
    status: dash?.status,
    timeline,
    generated_at: new Date().toISOString(),
  };
}