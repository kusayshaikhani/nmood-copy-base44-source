// The single reusable safe back-navigation helper for every Nmood screen whose
// Back arrow must return to the page the user actually came from.
//
// Why the raw WebView history cannot be trusted on its own:
//   * a `replace: true` entry redirect collapses the entry the user came from,
//     so navigate(-1) lands on a stale route or on nothing at all;
//   * a deep link / direct launch leaves the history stack empty, so
//     navigate(-1) leaves the WKWebView on a blank page;
//   * a cross-origin entry would send Back right out of the app.
//
// So the true origin is recorded explicitly in navigation state at the entry
// point (`useOriginState()`), validated against the real route table here, and
// only then used. Genuine internal history is the second choice, and a known
// safe parent path is the last resort.
import { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// Concrete in-app paths a Back arrow is allowed to land on; dynamic routes are
// covered by SAFE_PREFIXES. Anything unmatched is treated as an invalid
// destination (empty, undefined, external URL, or a stale replace-route) and is
// never navigated to.
const SAFE_PATHS = new Set([
  '/', '/explore', '/communities', '/messages', '/profile', '/nmood',
  '/inmood', '/inmood-v2', '/nmoods', '/notifications', '/journal',
  '/settings', '/settings/privacy', '/help', '/about', '/support', '/legal',
  '/my-experiences', '/saved', '/pals', '/calendar', '/search', '/planner',
  '/host', '/safety-center', '/relationship-hub', '/journey', '/goals',
  '/looking-for', '/discover-people', '/profile-views', '/upgrade',
]);

const SAFE_PREFIXES = [
  '/experience/', '/circle/', '/community/', '/messages/', '/pal/', '/goals/', '/nmood/',
];

// A path is a valid Back destination only when it is an app-internal absolute
// path (never `//host` or an external URL), maps to a real route, and is not the
// screen we are already on (which would be a no-op navigation loop).
export function isSafeBackPath(path, currentPath) {
  if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//')) return false;
  const clean = path.split(/[?#]/)[0].replace(/\/+$/, '') || '/';
  if (currentPath && clean === (currentPath.replace(/\/+$/, '') || '/')) return false;
  if (SAFE_PATHS.has(clean)) return true;
  return SAFE_PREFIXES.some((prefix) => clean.startsWith(prefix) && clean.length > prefix.length);
}

// True only when React Router has a real earlier entry in this app session.
// react-router-dom keeps an incrementing `idx` in history.state; index 0 is the
// first entry, so there is nothing safe to pop.
function hasInternalHistory() {
  try {
    return typeof window !== 'undefined' && Number(window.history?.state?.idx) > 0;
  } catch {
    return false;
  }
}

/**
 * Back handler for any screen a user expects to be able to leave.
 * `fallbackPath` is the known-safe parent, used only when neither a recorded
 * origin nor real internal history exists (direct launch or deep link).
 */
export function useSafeBack(fallbackPath = '/') {
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback(() => {
    const from = location.state?.from;
    if (isSafeBackPath(from, location.pathname)) {
      // Replace so Back itself never pushes an entry and cannot build a loop.
      navigate(from, { replace: true });
      return;
    }
    if (hasInternalHistory()) {
      navigate(-1);
      return;
    }
    navigate(isSafeBackPath(fallbackPath, location.pathname) ? fallbackPath : '/', { replace: true });
  }, [navigate, location.state, location.pathname, fallbackPath]);
}

/**
 * Returns the navigation state to attach at every entry point into a screen
 * that supports safe Back, so `useSafeBack()` can resolve the real origin.
 * Reads the router's location (not `window.location`) so it stays correct
 * under any router and inside redirect shims.
 * Never pass `replace: true` alongside this — that erases the entry the user
 * expects Back to return to.
 */
export function useOriginState() {
  const location = useLocation();
  const from = `${location.pathname}${location.search}`;
  return useCallback((extra) => ({ from, ...extra }), [from]);
}
