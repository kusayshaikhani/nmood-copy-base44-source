// SEC-001 Configurable client-side rate limiting. Defense in depth; the
// platform enforces server-side limits. Limits are per-device windows.
const KEY = 'nmood_rate_limits';

const PRESETS = {
  login: { max: 10, windowMs: 60_000 },
  registration: { max: 5, windowMs: 60_000 },
  password_reset: { max: 3, windowMs: 60_000 },
  connection_request: { max: 20, windowMs: 60_000 },
  messaging: { max: 60, windowMs: 60_000 },
  experience_creation: { max: 10, windowMs: 60_000 },
  circle_creation: { max: 10, windowMs: 60_000 },
  report_submission: { max: 10, windowMs: 60_000 },
  admin_api: { max: 120, windowMs: 60_000 },
};

function read() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch { return {}; }
}
function write(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
}

export function checkLimit(action) {
  const preset = PRESETS[action];
  if (!preset) return { allowed: true, remaining: Infinity };
  const state = read();
  const now = Date.now();
  const bucket = (state[action] || []).filter((t) => now - t < preset.windowMs);
  const allowed = bucket.length < preset.max;
  return { allowed, remaining: Math.max(0, preset.max - bucket.length) };
}

export function recordUse(action) {
  const preset = PRESETS[action];
  if (!preset) return;
  const state = read();
  const now = Date.now();
  const bucket = (state[action] || []).filter((t) => now - t < preset.windowMs);
  bucket.push(now);
  state[action] = bucket;
  write(state);
}

export function getRemaining(action) {
  return checkLimit(action).remaining;
}

export { PRESETS };