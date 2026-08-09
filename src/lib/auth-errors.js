/**
 * MP-003A — Auth error localization.
 * Maps server / SDK error messages to localized auth.* keys so every error
 * scenario (network, suspended, banned, locked, expired session, verification
 * required, invalid credentials) renders in the active language. Unrecognized
 * errors fall back to the raw server message, then to the provided generic
 * key — preserving prior behavior. Presentation only; no flow logic changed.
 */
const PATTERNS = [
  { re: /\b(network|fetch|connection|offline|internet|timeout|timed out|socket)\b/i, key: 'auth.error_network' },
  { re: /suspend/i, key: 'auth.error_account_suspended' },
  { re: /\b(ban|banned|blacklist)\b/i, key: 'auth.error_account_banned' },
  { re: /(locked|lockout|too many attempts|rate.?limit|throttl)/i, key: 'auth.error_account_locked' },
  { re: /(expired|invalid.{0,20}token|session)/i, key: 'auth.error_expired_session' },
  { re: /(not.?verified|unverified|verification.?required|verify.{0,10}email|email.?not.?verified)/i, key: 'auth.error_verification_required' },
  // Stale OAuth state — check BEFORE the generic "cancel" pattern so a
  // state-mismatch error containing "cancel" is not mislabeled as user cancellation.
  { re: /\b(stale.+state|state.+mismatch|invalid.+state|session.+conflict|session.+not.+cleared|pending.+auth)\b/i, key: 'auth.error_oauth_stale_state' },
  // Only map genuine user cancellations to "cancelled" — not "denied" or
  // "access_denied" which are provider/authorization errors, not user actions.
  { re: /\b(cancel|cancell?ed|user.+closed|closed.+by.+user|dismiss|abort)\b/i, key: 'auth.error_social_cancelled' },
  { re: /disallowed_useragent|embedded|webview/i, key: 'auth.error_oauth_disallowed_user_agent' },
  { re: /\b(redirect.+fail|callback.+fail|redirect.+mismatch|redirect.+uri|invalid.+redirect)\b/i, key: 'auth.error_oauth_redirect_failure' },
  { re: /\b(unauthorized.+client|access.+denied|forbidden)\b/i, key: 'auth.error_oauth_unauthorized_client' },
  { re: /\b(certificate|sha.+fingerprint|signing.+key.+mismatch|package.+name.+mismatch)\b/i, key: 'auth.error_oauth_certificate_mismatch' },
  { re: /no.+email|email.+not.+available|email.+missing|email.+required/i, key: 'auth.error_social_email_unavailable' },
];

export function localizeAuthError(err, t, fallbackKey, opts = {}) {
  const raw = err?.message || (typeof err === 'string' ? err : '') || '';
  if (!raw) return t(fallbackKey);
  const msg = String(raw).toLowerCase();
  for (const { re, key } of PATTERNS) {
    if (re.test(msg)) return t(key);
  }
  if (/(invalid|incorrect|wrong).{0,40}(email|password|credential)|invalid.?credentials|email.?or.?password|phone.?or.?password/.test(msg)) {
    return t(opts.method === 'phone' ? 'auth.error_invalid_phone_password' : 'auth.error_invalid_email_password');
  }
  return raw || t(fallbackKey);
}

export default localizeAuthError;