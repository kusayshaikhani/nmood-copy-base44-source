// Section 7 — Shared post-authentication resolver.
//
// One resolver for email, Google, and Apple login. Resolves the authenticated
// user's canonical Member record and redirects to the correct destination:
//   - No Member or onboarding incomplete → /onboarding
//   - Onboarding complete → safe requested route or Home
//
// Never trusts a user-supplied external redirect. Never creates duplicate
// Member records. An existing OAuth user continues resolving to the same
// Member (getOwnMember is scoped to the authenticated user's id + email).

import { base44 } from '@/api/base44Client';
import { getOwnMember } from '@/lib/member-profile';
import { isOnboardingComplete } from '@/lib/eligibility';

const POST_AUTH_TARGET_KEY = 'nmood:post_auth_target';

// Auth routes that should never be a post-auth destination (landing back on
// login/register after authenticating is pointless). Admin/founder routes
// are handled by their own redirect guards, not this resolver.
const BLOCKED_RETURN_PREFIXES = ['/auth', '/login', '/register', '/forgot-password', '/reset-password'];

// Validate a return URL — same-origin relative path only, no open redirect.
// Returns '/' for anything unsafe (external, scheme, protocol-relative, auth route).
export function safeReturnPath(target) {
  if (typeof target !== 'string') return '/';
  const trimmed = target.trim();
  if (!trimmed) return '/';
  // Must be a relative path — reject schemes and protocol-relative "//".
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return '/';
  // Reject backslashes / whitespace / embedded schemes used to bypass checks.
  if (/[\\\s]/.test(trimmed) || trimmed.includes(':')) return '/';
  // Reject auth routes — no point returning to login/register after auth.
  if (BLOCKED_RETURN_PREFIXES.some((p) => trimmed === p || trimmed.startsWith(p + '?') || trimmed.startsWith(p + '/'))) {
    return '/';
  }
  return trimmed;
}

// Resolve the destination based on user + member state (pure function).
export function resolvePostAuthDestination(user, member, safeReturnUrl) {
  const destination = safeReturnPath(safeReturnUrl);
  // No member or onboarding incomplete → onboarding.
  if (!member || !isOnboardingComplete(member)) return '/onboarding';
  // Onboarding complete → safe return URL (already validated).
  return destination;
}

// Store the safe return URL in localStorage before an OAuth redirect.
// Retrieved by checkUserAuth after the platform redirects back to the app.
export function setPostAuthTarget(target) {
  try {
    window.localStorage.setItem(
      POST_AUTH_TARGET_KEY,
      safeReturnPath(target)
    );
  } catch {
    // Storage unavailable
  }
}

export function getAndClearPostAuthTarget() {
  try {
    const target = window.localStorage.getItem(
      POST_AUTH_TARGET_KEY
    );

    window.localStorage.removeItem(
      POST_AUTH_TARGET_KEY
    );

    return target;
  } catch {
    return null;
  }
}

// Shared post-authentication resolver: me() + getOwnMember + hard redirect.
// Used by email login, email registration (OTP), and the OAuth callback path.
export async function postAuthRedirect(safeReturnUrl = '/', onResolved) {
  try {
    const user = await base44.auth.me();
    const member = await getOwnMember(user.id, user.email);
    const destination = resolvePostAuthDestination(user, member, safeReturnUrl);
    // R3.1 — Optional callback fired with the resolved destination before
    // the hard redirect. Used by EmailVerification to clear pending
    // registration data only when onboarding is skipped (existing Member).
    if (typeof onResolved === 'function') {
      onResolved(destination, user, member);
    }
    window.location.href = destination;
  } catch {
    // If resolution fails, the session is invalid — go to the auth placeholder.
    window.location.href = '/auth';
  }
}