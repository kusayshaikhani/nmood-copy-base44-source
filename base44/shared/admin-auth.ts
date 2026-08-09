// Shared authorization helpers for backend functions.
//
// Provides admin-or-platform-cron gating for privileged / scheduled endpoints.
// A platform cron invocation carries the CRON_SECRET value in the
// `x-cron-secret` header; anonymous HTTP callers cannot supply it, so endpoints
// that must run without a user session (scheduled cleanup, snapshots) stay
// protected while still allowing trusted automated execution once configured.

const ADMIN_ROLES = ['admin', 'founder'];

export async function resolveCaller(base44, req) {
  const cronSecret = Deno.env.get('CRON_SECRET');
  const supplied = req.headers.get('x-cron-secret');
  if (cronSecret && supplied && supplied === cronSecret) {
    return { user: null, isCron: true };
  }
  let user = null;
  try { user = await base44.auth.me(); } catch { /* not authenticated */ }
  return { user, isCron: false };
}

// Returns { ok: true, user, isCron } on success, or { ok: false, response }.
export async function requireAdminOrCron(base44, req) {
  const { user, isCron } = await resolveCaller(base44, req);
  if (isCron) return { ok: true, user: null, isCron: true };
  if (!user) {
    return { ok: false, response: Response.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  if (!ADMIN_ROLES.includes(user.role)) {
    return { ok: false, response: Response.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return { ok: true, user, isCron: false };
}