// A Premium badge is an entitlement statement, not administrator feature access.
// The server is authoritative; expiry can only withdraw a previously verified badge.
export function hasVerifiedSubscriptionPremium(projection, now = Date.now()) {
  if (projection?.subscriptionPremium !== true) return false;
  if (!['active', 'trial', 'grace_period'].includes(projection.membership?.status)) return false;
  const expiry = projection.membership?.expires_at;
  if (expiry == null) return true;
  const instant = Date.parse(expiry);
  return Number.isFinite(instant) && instant > now;
}
