import { App as NativeApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { restoreSupabaseSessionFromUrl } from '@/api/supabaseClient';
import { categorizeOAuthError } from '@/lib/oauth-diagnostics';

export function parseAppPath(rawUrl) {
  if (!rawUrl) return null;
  try {
    const url = new URL(rawUrl);
    if (url.protocol === 'https:' || url.protocol === 'http:') {
      return `${url.pathname}${url.search}${url.hash}`;
    }
    if (url.protocol === 'nmood:') {
      // Handles nmood://reset-password?... (hostname = 'reset-password')
      // and nmood:/reset-password?... or nmood:///reset-password?... (hostname = '', pathname = '/reset-password')
      const hostPart = url.hostname ? `/${url.hostname}` : '';
      const pathPart = url.pathname ? (url.pathname.startsWith('/') ? url.pathname : `/${url.pathname}`) : '';
      const combined = `${hostPart}${pathPart}`.replace(/\/+/g, '/') || '/';
      return `${combined}${url.search}${url.hash}`;
    }
    return null;
  } catch {
    return null;
  }
}

export function isRecoveryUrl(rawUrl, targetPath) {
  const full = `${rawUrl || ''} ${targetPath || ''}`;
  if (full.includes('/reset-password')) return true;
  if (full.includes('type=recovery')) return true;
  return false;
}

async function openRecoveryUrl(rawUrl) {
  const target = parseAppPath(rawUrl);
  if (!target) return false;

  const isRecovery = isRecoveryUrl(rawUrl, target);
  const targetPathOnly = target.split('?')[0].split('#')[0];
  const isOAuthCallback = !isRecovery && targetPathOnly === '/auth';

  // For recovery links, ensure destination route is /reset-password with all params preserved
  let destination = target;
  if (isRecovery && targetPathOnly !== '/reset-password') {
    const searchAndHash = target.slice(targetPathOnly.length);
    destination = `/reset-password${searchAndHash}`;
  }

  let session = null;
  try {
    session = await restoreSupabaseSessionFromUrl(rawUrl);
  } catch (err) {
    // If it's an OAuth callback, rethrow so handleRecoveryFailure can handle OAuth error.
    // For password recovery, do NOT throw or fail to sign-in; proceed to /reset-password
    // where ResetPassword.jsx handles the status.
    if (isOAuthCallback) throw err;
  }

  if (isOAuthCallback && !session) {
    throw new Error('OAuth callback did not contain a session.');
  }

  // For OAuth callbacks, clean the URL so window.location does not leave
  // the already-consumed single-use PKCE code or tokens, preventing duplicate
  // exchange failures when AuthContext runs checkUserAuth. For password recovery,
  // preserve the destination path and parameters.
  if (isOAuthCallback) {
    window.history.replaceState({}, '', '/auth');
  } else {
    window.history.replaceState({}, '', destination);
  }
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.dispatchEvent(new CustomEvent('nmood:auth-callback', {
    detail: { url: rawUrl, isRecovery, destination, session }
  }));
  return true;
}

async function closeExternalBrowser() {
  try {
    await Browser.close();
  } catch {
    // The browser may already have closed itself on the deep-link callback.
  }
}

// Used only when openRecoveryUrl itself throws (an actual OAuth sign-in
// failure, or some unexpected error before the callback path could even be
// determined) — routes the failure to the right screen instead of always
// forcing /auth with the OAuth-flavored "sign-in timed out" message.
function handleRecoveryFailure(rawUrl) {
  const target = parseAppPath(rawUrl);
  const isRecovery = isRecoveryUrl(rawUrl, target);

  if (isRecovery) {
    // Land on Reset Password's own screen — never the sign-in screen,
    // and never the OAuth timeout message. Preserve params if available.
    const destination = target && target.startsWith('/reset-password') ? target : '/reset-password';
    window.history.replaceState({}, '', destination);
    window.dispatchEvent(new PopStateEvent('popstate'));
    return;
  }

  window.sessionStorage.setItem('nmood:oauth_callback_error', '1');
  window.history.replaceState({}, '', '/auth');
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.dispatchEvent(new CustomEvent('nmood:auth-callback-error'));
}

// Cold iOS/Android launches via a custom-scheme URL deliver the SAME url to
// BOTH the `appUrlOpen` listener and `getLaunchUrl()`. Without dedup, the
// first call consumes the single-use PKCE code and deletes the verifier, and
// the second (duplicate) call re-runs the exchange with no verifier and an
// already-used code — which fails and overwrites a just-succeeded sign-in
// with the "sign-in timed out" error, bouncing the user back to /auth.
// Track which raw URLs have already been processed so the duplicate is a
// silent no-op instead of a second, failing code exchange.
const handledUrls = new Set();

async function handleIncomingUrl(rawUrl) {
  if (!rawUrl || handledUrls.has(rawUrl)) return;
  handledUrls.add(rawUrl);
  try {
    if (await openRecoveryUrl(rawUrl)) await closeExternalBrowser();
  } catch (err) {
    // Non-sensitive diagnostic: reports only the failure category and target
    // path — never the code, token, or PKCE verifier.
    console.warn('[NativeAuth] OAuth callback stage failed', {
      target: parseAppPath(rawUrl),
      category: categorizeOAuthError(err),
    });
    handleRecoveryFailure(rawUrl);
  }
}

export async function installNativeRecoveryLinkHandler() {
  if (!Capacitor.isNativePlatform()) return () => {};
  const listener = await NativeApp.addListener('appUrlOpen', ({ url }) => handleIncomingUrl(url));
  const launch = await NativeApp.getLaunchUrl();
  if (launch?.url) await handleIncomingUrl(launch.url);
  return () => listener.remove();
}
