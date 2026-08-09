// SEC-001 — Client-side brute-force throttle for auth screens.
// The platform enforces server-side rate limiting; this adds a local
// UX lockout so repeated failures don't keep spamming the auth endpoint.
const KEY = 'nmood_auth_throttle';
const MAX_ATTEMPTS = 5;
const LOCK_MS = 30_000;

const read = () => {
  try { return JSON.parse(localStorage.getItem(KEY) || 'null') || null; } catch { return null; }
};
const write = (s) => {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ }
};

export function getLockoutRemaining() {
  const s = read();
  if (!s || !s.lockedUntil) return 0;
  return Math.max(0, s.lockedUntil - Date.now());
}

export function isLockedOut() { return getLockoutRemaining() > 0; }

export function recordFailedAttempt() {
  const s = read() || { fails: 0, lockedUntil: 0 };
  s.fails = (s.fails || 0) + 1;
  if (s.fails >= MAX_ATTEMPTS) { s.lockedUntil = Date.now() + LOCK_MS; s.fails = 0; }
  write(s);
  return s.lockedUntil ? getLockoutRemaining() : 0;
}

export function resetAttempts() { write({ fails: 0, lockedUntil: 0 }); }