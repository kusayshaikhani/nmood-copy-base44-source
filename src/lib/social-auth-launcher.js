// Social auth launcher — hardened for embedded WebViews.
//
// Base44's loginWithProvider redirects the current page to the OAuth broker.
// On a normal browser tab the page unloads and the callback returns to a fresh
// load — no spinner to clear. Inside an embedded Android/iOS WebView the
// redirect can fail silently (Google: disallowed_useragent) or open a system
// browser that never hands the session back to the WebView — leaving the
// loading spinner spinning forever (the Android internal-test hang).
//
// This module guarantees the loading state is cleared on every path:
//   • Embedded WebView with no external-browser bridge → fail-fast error.
//   • Sync throw / async rejection from the SDK → categorized error.
//   • Redirect never fires (page stays visible) → bounded timeout error.
//   • External browser opened, user returns without completing → spinner
//     cleared silently after a grace period so the user can retry.
//
// Never logs or exposes tokens, codes, or secrets. Error categories are
// non-sensitive (see oauth-diagnostics.js).

import {
  detectNativeEnvironment,
  categorizeOAuthError,
  getOAuthErrorTranslationKey,
} from '@/lib/oauth-diagnostics';

// --- Native OAuth bridge detection ---
// Follows the same pattern as native-billing-bridge.js. The Base44 native
// wrapper may expose a bridge that opens URLs in the system browser and
// returns via deep link. If present, loginWithProvider's redirect is
// intercepted and handled externally — safe to proceed inside a WebView.
function getNativeOAuthBridge() {
  if (typeof window === 'undefined') return null;
  // Base44 native wrapper globals
  if (window.__base44_native && typeof window.__base44_native.openExternalUrl === 'function')
    return window.__base44_native;
  if (window.base44_native_bridge && typeof window.base44_native_bridge.openExternalUrl === 'function')
    return window.base44_native_bridge;
  // Capacitor Browser plugin (if the wrapper uses Capacitor)
  const cap = window.Capacitor;
  if (cap?.Plugins?.Browser && typeof cap.Plugins.Browser.open === 'function')
    return cap.Plugins.Browser;
  // iOS WKWebView message handler
  if (window.webkit?.messageHandlers?.NmoodOAuth)
    return window.webkit.messageHandlers.NmoodOAuth;
  // Android global
  if (window.NmoodOAuth && typeof window.NmoodOAuth.openExternalUrl === 'function')
    return window.NmoodOAuth;
  return null;
}

// True when running inside an embedded Android/iOS WebView where the built-in
// OAuth redirect is likely to fail or hand off to a system browser that cannot
// write the session back into the WebView.
export function isEmbeddedWebView() {
  const env = detectNativeEnvironment();
  return Boolean(env.isNative || env.isAndroidWebView || env.isIOSWebView);
}

// Can the native wrapper hand OAuth off to the system browser and return via
// deep link? If not, we must fail fast inside an embedded WebView.
export function hasExternalOAuthBridge() {
  return getNativeOAuthBridge() !== null;
}

// Bounded redirect-initiation timeout (ms). If the page hasn't navigated away
// or gone to background within this window, the redirect failed to fire.
const REDIRECT_TIMEOUT_MS = 15000;

// Grace period after the page becomes visible again (ms). Gives the auth
// callback a moment to process before we decide the OAuth didn't complete.
const RETURN_GRACE_MS = 2000;

/**
 * Launch a social OAuth flow with guaranteed loading-state cleanup.
 *
 * @param {object} opts
 * @param {'google'|'apple'} opts.provider
 * @param {function} opts.setLoading — setLoading(null) to clear the spinner
 * @param {function} opts.setError — setError(localizedMessage) to show an error
 * @param {function} opts.t — translation function
 * @param {function} opts.launch — calls base44.auth.loginWithProvider
 * @returns {function} cleanup — call on React unmount to remove listeners/timers
 */
export function launchSocialAuth({ provider, setLoading, setError, t, launch }) {
  // 1. Fail fast in an embedded WebView with no external-browser bridge.
  //    Google returns disallowed_useragent; Apple may silently fail. Without a
  //    bridge to hand off to the system browser, the session can never return
  //    to the WebView — so we never start the flow.
  if (isEmbeddedWebView() && !hasExternalOAuthBridge()) {
    setLoading(null);
    setError(t('auth.error_oauth_embedded_webview'));
    return () => {};
  }

  let timedOut = false;
  let cancelled = false;
  let graceId = null;
  let timeoutId = null;

  const cleanup = () => {
    if (timeoutId) clearTimeout(timeoutId);
    if (graceId) clearTimeout(graceId);
    document.removeEventListener('visibilitychange', onVisibility);
  };

  // 2. Bounded redirect-initiation timeout.
  timeoutId = setTimeout(() => {
    if (cancelled) return;
    if (document.visibilityState === 'visible') {
      // Page still visible — the redirect never fired (blocked, network, etc.)
      timedOut = true;
      cleanup();
      setLoading(null);
      setError(t('auth.error_oauth_timeout'));
    } else {
      // Page hidden — an external browser likely opened. Clear the spinner
      // silently; the visibility listener handles the return.
      cleanup();
      setLoading(null);
    }
  }, REDIRECT_TIMEOUT_MS);

  // 3. Visibility listener — detects "returned without completing auth."
  //    When the page comes back to the foreground, wait a brief grace period
  //    for the auth callback to process, then clear the spinner if we're still
  //    on the sign-in page. No error is shown — the user may have just switched
  //    back; clearing the spinner lets them retry.
  const onVisibility = () => {
    if (cancelled || timedOut) return;
    if (document.visibilityState === 'visible') {
      if (graceId) clearTimeout(graceId);
      graceId = setTimeout(() => {
        if (cancelled || timedOut) return;
        if (document.visibilityState === 'visible') {
          cleanup();
          setLoading(null);
        }
      }, RETURN_GRACE_MS);
    }
  };
  document.addEventListener('visibilitychange', onVisibility);

  // 4. Launch the OAuth flow. Handle both sync throws and async rejections.
  try {
    const result = launch();
    if (result && typeof result.catch === 'function') {
      result.catch((err) => {
        if (cancelled || timedOut) return;
        cancelled = true;
        cleanup();
        setLoading(null);
        const category = categorizeOAuthError(err);
        setError(t(getOAuthErrorTranslationKey(category)));
      });
    }
  } catch (err) {
    if (cancelled || timedOut) return;
    cancelled = true;
    cleanup();
    setLoading(null);
    const category = categorizeOAuthError(err);
    setError(t(getOAuthErrorTranslationKey(category)));
  }

  return cleanup;
}