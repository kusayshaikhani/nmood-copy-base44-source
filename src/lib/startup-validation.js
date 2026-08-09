// RM-003 Startup validation. On app boot, validates critical dependencies
// (database, storage, notification, subscription, required secrets, env vars)
// via the systemOps startupValidation endpoint. In production, a critical
// failure blocks the UI by routing to the error page.
import { IS_PROD } from './runtime-env';
import { base44 } from '@/api/base44Client';
import { runFounderAccessAudit } from './founder-access-audit';

const SESSION_KEY = 'nmood:startup_validated';

export async function runStartupValidation() {
  if (typeof window === 'undefined') return { ok: true };
  // Run the Founder Access regression audit on every boot (non-blocking).
  try { runFounderAccessAudit(); } catch { /* non-blocking */ }
  if (sessionStorage.getItem(SESSION_KEY)) return { ok: true, cached: true };
  try {
    const res = await base44.functions.invoke('systemOps', { mode: 'startupValidation' });
    sessionStorage.setItem(SESSION_KEY, '1');
    const critical = (res?.checks || []).filter((c) => c.status === 'critical').length;
    if (IS_PROD && critical > 0) {
      // Critical dependency down — prevent production startup.
      window.location.replace('/error');
      return { ok: false, blocked: true };
    }
    return { ok: true, checks: res?.checks || [] };
  } catch {
    // Non-blocking: allow the app to render; health is monitored separately.
    sessionStorage.setItem(SESSION_KEY, '1');
    return { ok: true, degraded: true };
  }
}