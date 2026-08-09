// BUG-001: centralized session-termination flag.
//
// The platform can re-issue an access_token (via the lingering session cookie)
// into the logout-redirect URL. app-params reads that token at import time and
// re-creates the base44 client authenticated — silently restoring the session.
//
// To stop that, logout() sets a persistent "session terminated" flag in
// localStorage. On the next app load, app-params sees the flag, purges any
// token (localStorage + URL), and builds the client without one — so refresh,
// manual navigation, and a new browser tab all stay logged out.
//
// The flag is cleared ONLY at a fresh, intentional login (Login/Register
// flows call clearLoggedOut() right before their post-login redirect).

export const LOGOUT_FLAG = 'nmood:session_terminated';

export function markLoggedOut() {
  try {
    window.localStorage.setItem(LOGOUT_FLAG, '1');
  } catch { /* storage unavailable */ }
}

export function clearLoggedOut() {
  try {
    window.localStorage.removeItem(LOGOUT_FLAG);
  } catch { /* storage unavailable */ }
}

export function isLoggedOutFlagSet() {
  try {
    return window.localStorage.getItem(LOGOUT_FLAG) === '1';
  } catch {
    return false;
  }
}

// Remove any access token from localStorage AND strip it from the current URL
// (the server may have appended ?access_token=… to the logout redirect).
export function purgeAccessToken() {
  try {
    window.localStorage.removeItem('base44_access_token');
    window.localStorage.removeItem('token');
  } catch { /* storage unavailable */ }
  if (typeof window === 'undefined' || !window.location) return;
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.has('access_token')) {
      url.searchParams.delete('access_token');
      const qs = url.searchParams.toString();
      window.history.replaceState(
        {},
        document.title,
        url.pathname + (qs ? `?${qs}` : '') + url.hash
      );
    }
  } catch { /* malformed url */ }
}