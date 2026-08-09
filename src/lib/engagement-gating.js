// Engagement overlay route gating — prevents Weekly Recap / Celebration
// overlays from appearing on detail/action routes where they can cover CTAs
// or the composer. Keep in sync with AppShell full-bleed + detail routes.

export function isEngagementQuietRoute(pathname) {
  if (!pathname) return true;
  const p = String(pathname).replace(/\/+$/, '');
  if (p === '/onboarding') return true;
  if (p.startsWith('/circle/')) return true;      // Circle detail (sticky CTA)
  if (p.startsWith('/experience/')) return true;  // Experience detail / chat / day (CTA)
  if (p.startsWith('/community/')) return true;   // Community detail (CTA)
  if (p.startsWith('/messages/')) return true;    // DM chat (composer)
  if (p.startsWith('/host/create')) return true;  // Create flows (action footers)
  return false;
}