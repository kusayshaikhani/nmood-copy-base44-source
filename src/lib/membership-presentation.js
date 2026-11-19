export const RENEWAL_WINDOW_MS = 72 * 60 * 60 * 1000;
export function renewalDueAt(membership) {
  const expiry = Date.parse(membership?.expires_at || membership?.renewal_date || '');
  return Number.isFinite(expiry) ? expiry - RENEWAL_WINDOW_MS : null;
}
export function renewalIsDue(membership, now = Date.now()) {
  const due = renewalDueAt(membership);
  return membership?.type === 'premium' && due !== null && now >= due && now < due + RENEWAL_WINDOW_MS;
}
export function planDuration(period) {
  const match = /^P(\d+)([DWMY])$/.exec(period || '');
  if (!match) return null;
  const unit = { D: 'day', W: 'week', M: 'month', Y: 'year' }[match[2]];
  return `${Number(match[1])} ${unit}${Number(match[1]) === 1 ? '' : 's'}`;
}
export function membershipDate(value) {
  const date = new Date(value);
  return value && Number.isFinite(date.getTime()) ? date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : null;
}

export const EXPLORER_MESSAGES = Object.freeze({
  allowance: 'Explorer includes 30 Likes in each rolling 24-hour period. Passing is unlimited and does not use a Like.',
  discovery: 'You’ve used your 30 Likes for this 24-hour period. You can keep browsing and passing profiles. Premium includes unlimited Likes.',
  incoming: 'You have a request. Viewing and responding is included with Premium.',
  unavailable: 'Discovery access could not be verified. Please retry.',
});

// Preserve old server enforcement while presenting the current calm wording.
export function membershipErrorMessage(message, detail) {
  if (detail === 'NMOOD_LIKE_LIMIT_REACHED' || detail === 'NMOOD_EXPLORER_DISCOVERY_LOCKED') return EXPLORER_MESSAGES.discovery;
  if (detail === 'NMOOD_EXPLORER_INCOMING_LOCKED') return EXPLORER_MESSAGES.incoming;
  return message;
}
