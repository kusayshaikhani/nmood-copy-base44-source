// OAuth error categorization and native-environment diagnostics.
//
// Base44's built-in loginWithProvider('google') is a sealed hosted flow:
// it redirects to Base44's own OAuth broker, uses Base44's Google client,
// and writes the session into the browser that ran it. On Android native
// (WebView wrapper), this can fail because:
//   - Google blocks OAuth in embedded WebViews (disallowed_useragent).
//   - The OAuth flow opens in the system browser (Chrome Custom Tab), not
//     the WebView, so the redirect back to the app may not return the token
//     to the WebView's storage.
//   - The 10s timeout fires and shows a misleading "cancelled" message.
//
// This module:
//   1. Categorizes OAuth errors into non-sensitive, actionable categories.
//   2. Detects the native Android/iOS WebView environment for diagnostics.
//   3. Logs diagnostic info to the console for debugging.

// --- Error categories (non-sensitive, safe to display) ---
export const OAUTH_ERROR_CATEGORIES = {
  USER_CANCELLED: 'user_cancelled',
  REDIRECT_FAILURE: 'redirect_failure',
  INVALID_CLIENT: 'invalid_client',
  UNAUTHORIZED_CLIENT: 'unauthorized_client',
  CERTIFICATE_MISMATCH: 'certificate_mismatch',
  CALLBACK_FAILURE: 'callback_failure',
  PROVIDER_ERROR: 'provider_error',
  TIMEOUT: 'timeout',
  DISALLOWED_USER_AGENT: 'disallowed_user_agent',
  NETWORK_ERROR: 'network_error',
  STALE_STATE: 'stale_state',
  SESSION_NOT_CLEARED: 'session_not_cleared',
  UNKNOWN: 'unknown',
};

// Map a raw error (string, Error, or SDK error object) to a category.
// Never logs or returns sensitive details — only the category.
export function categorizeOAuthError(err) {
  if (!err) {
    return OAUTH_ERROR_CATEGORIES.UNKNOWN;
  }

  const rawCode =
    err?.code ||
    err?.error ||
    err?.type ||
    err?.statusText ||
    '';

  const rawMessage =
    typeof err === 'string'
      ? err
      : err?.message || err?.error_description || '';

  const code = String(rawCode).trim().toLowerCase();
  const msg = String(rawMessage).trim().toLowerCase();
  const combined = `${code} ${msg}`.trim();

  /*
   * Only classify a login as genuinely cancelled when the provider or SDK
   * returns a specific cancellation code. Do not infer cancellation merely
   * because an error message contains "cancel", "closed", or "abort".
   */
  const genuineCancellationCodes = new Set([
    'user_cancelled',
    'user_canceled',
    'cancelled',
    'canceled',
    'popup_closed_by_user',
    'access_denied_by_user',
  ]);

  if (genuineCancellationCodes.has(code)) {
    return OAUTH_ERROR_CATEGORIES.USER_CANCELLED;
  }

  // OAuth state/session problems after logout.
  if (
    /stale.?state|state.?mismatch|invalid.?state|state.?expired|session.?conflict|session.?not.?cleared|pending.?auth|oauth.?state/i.test(
      combined
    )
  ) {
    return OAUTH_ERROR_CATEGORIES.STALE_STATE;
  }

  // Session/cookie was not fully terminated or restored correctly.
  if (
    /previous.?session|existing.?session|already.?logged|session.?still.?active|cookie.?session|session.?restore/i.test(
      combined
    )
  ) {
    return OAUTH_ERROR_CATEGORIES.SESSION_NOT_CLEARED;
  }

  // Google refuses authentication inside an embedded WebView.
  if (
    /disallowed_useragent|disallowed_user_agent|embedded.?browser|embedded.?webview|webview.?not.?supported/i.test(
      combined
    )
  ) {
    return OAUTH_ERROR_CATEGORIES.DISALLOWED_USER_AGENT;
  }

  // Callback processing failed after returning from Google.
  if (
    /callback.?fail|callback.?error|oauth.?callback|missing.?code|missing.?token|token.?exchange|authorization.?code/i.test(
      combined
    )
  ) {
    return OAUTH_ERROR_CATEGORIES.CALLBACK_FAILURE;
  }

  // Redirect URI or destination is incorrect.
  if (
    /redirect.?fail|redirect_uri_mismatch|redirect.?mismatch|invalid.?redirect|redirect.?uri/i.test(
      combined
    )
  ) {
    return OAUTH_ERROR_CATEGORIES.REDIRECT_FAILURE;
  }

  // Invalid OAuth client configuration.
  if (
    /invalid_client|client.?not.?found|invalid.?client.?id|missing.?client/i.test(
      combined
    )
  ) {
    return OAUTH_ERROR_CATEGORIES.INVALID_CLIENT;
  }

  // OAuth client is not permitted.
  if (
    /unauthorized_client|client.?unauthorized|not.?authorized/i.test(
      combined
    )
  ) {
    return OAUTH_ERROR_CATEGORIES.UNAUTHORIZED_CLIENT;
  }

  // Android signing/package mismatch.
  if (
    /certificate|sha-?1|sha-?256|fingerprint|signing.?key|package.?name|developer_error/i.test(
      combined
    )
  ) {
    return OAUTH_ERROR_CATEGORIES.CERTIFICATE_MISMATCH;
  }

  // Network failures.
  if (
    /network|fetch|connection|offline|internet|socket|dns/i.test(
      combined
    )
  ) {
    return OAUTH_ERROR_CATEGORIES.NETWORK_ERROR;
  }

  // Timeout is distinct from user cancellation.
  if (/timeout|timed.?out/i.test(combined)) {
    return OAUTH_ERROR_CATEGORIES.TIMEOUT;
  }

  // Provider-side error.
  if (
    /provider.?error|google.?error|oauth.?error|server.?error|500|502|503/i.test(
      combined
    )
  ) {
    return OAUTH_ERROR_CATEGORIES.PROVIDER_ERROR;
  }

  return OAUTH_ERROR_CATEGORIES.UNKNOWN;
}
// --- Native environment detection ---
export function detectNativeEnvironment() {
  if (typeof window === 'undefined' || !navigator) return { isNative: false, platform: 'server' };
  const ua = navigator.userAgent || '';
  // Android WebView indicators.
  const isAndroid = /android/i.test(ua);
  const isAndroidWebView = isAndroid && /wv|webview/i.test(ua);
  // iOS WebView indicators (WKWebView).
  const isIOS = /iphone|ipad|ipod/i.test(ua);
  const isIOSWebView = isIOS && !/safari/i.test(ua) && !/crios/i.test(ua);
  // Base44 native wrapper loads the app from the production domain inside a WebView.
  const isNative = isAndroidWebView || isIOSWebView ||
    (typeof window.__base44_native !== 'undefined') ||
    (isAndroid && /nmood/i.test(ua));
  return {
    isNative,
    isAndroidWebView,
    isIOSWebView,
    isAndroid,
    isIOS,
    platform: isAndroid ? 'android' : isIOS ? 'ios' : 'web',
    userAgent: ua.substring(0, 120), // truncated for logging
  };
}

// Log OAuth diagnostic info (non-sensitive) before initiating the flow.
export function logOAuthDiagnostics(provider, returnUrl) {
  const env = detectNativeEnvironment();
  console.log('[OAuth] diagnostics', {
    provider,
    returnUrl,
    platform: env.platform,
    isNative: env.isNative,
    isAndroidWebView: env.isAndroidWebView,
    isIOSWebView: env.isIOSWebView,
    origin: typeof window !== 'undefined' ? window.location?.origin : null,
    host: typeof window !== 'undefined' ? window.location?.hostname : null,
  });
  if (env.isNative) {
    console.warn(`[OAuth] Native ${env.platform} environment detected — Base44 built-in loginWithProvider may not return the session to the WebView. If Google login fails, check: (1) Android package name matches Base44 dashboard, (2) SHA-1/SHA-256 fingerprints registered in Google Cloud Console, (3) OAuth redirect URI configured for the app's domain.`);
  }
  return env;
}

// Get the translation key for an error category.
export function getOAuthErrorTranslationKey(category) {
  const map = {
    [OAUTH_ERROR_CATEGORIES.USER_CANCELLED]: 'auth.error_social_cancelled',
    [OAUTH_ERROR_CATEGORIES.TIMEOUT]: 'auth.error_oauth_timeout',
    [OAUTH_ERROR_CATEGORIES.REDIRECT_FAILURE]: 'auth.error_oauth_redirect_failure',
    [OAUTH_ERROR_CATEGORIES.INVALID_CLIENT]: 'auth.error_oauth_invalid_client',
    [OAUTH_ERROR_CATEGORIES.UNAUTHORIZED_CLIENT]: 'auth.error_oauth_unauthorized_client',
    [OAUTH_ERROR_CATEGORIES.CERTIFICATE_MISMATCH]: 'auth.error_oauth_certificate_mismatch',
    [OAUTH_ERROR_CATEGORIES.CALLBACK_FAILURE]: 'auth.error_oauth_callback_failure',
    [OAUTH_ERROR_CATEGORIES.PROVIDER_ERROR]: 'auth.error_oauth_provider_error',
    [OAUTH_ERROR_CATEGORIES.DISALLOWED_USER_AGENT]: 'auth.error_oauth_disallowed_user_agent',
    [OAUTH_ERROR_CATEGORIES.NETWORK_ERROR]: 'auth.error_network',
    [OAUTH_ERROR_CATEGORIES.STALE_STATE]: 'auth.error_oauth_stale_state',
    [OAUTH_ERROR_CATEGORIES.SESSION_NOT_CLEARED]: 'auth.error_oauth_session_not_cleared',
    [OAUTH_ERROR_CATEGORIES.UNKNOWN]: 'auth.error_social_failed',
  };
  return map[category] || 'auth.error_social_failed';
}