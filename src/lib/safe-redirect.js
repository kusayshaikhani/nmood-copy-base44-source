// CWE-601 (Open Redirect) guard for the admin auth flow.
// Only same-origin "/admin" paths are permitted as a post-login destination;
// anything else (protocol-relative URLs, schemes, backslashes, external hosts)
// falls back to "/admin". Applied at every redirect sink in the admin login
// flow so a tampered `from`/target value can never redirect off-origin.
// Returns an empty string for non-string/empty input so callers can keep a
// truthy "was a target set?" check separate from the sanitized destination.
export function safeAdminRedirect(target) {
  if (typeof target !== 'string') return '';
  const trimmed = target.trim();
  if (!trimmed) return '';
  // Must be a relative path — reject schemes and protocol-relative "//".
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return '/admin';
  // Reject backslashes / whitespace / embedded schemes used to bypass checks.
  if (/[\\\s]/.test(trimmed) || trimmed.includes(':')) return '/admin';
  // Must land within the admin console (exact path, sub-path, or query).
  if (trimmed === '/admin' || trimmed.startsWith('/admin/') || trimmed.startsWith('/admin?')) {
    return trimmed;
  }
  return '/admin';
}