// Single coordinator for consuming a Google/Apple OAuth redirect callback.
//
// Every delivery path (a mounted /auth/callback web route, Capacitor's
// appUrlOpen event, and Capacitor's getLaunchUrl cold-start check) MUST call
// consumeAuthCallback() and nothing else. Do not add a second, independent
// code-exchange call anywhere — a PKCE code is single-use, and Supabase
// rejects (and Nmood must not retry) an already-consumed code.
//
// Primary callback (new): an HTTPS Universal Link —
//   https://app.nmood.app/auth/callback?code=...
// Legacy callback (kept only until the HTTPS path is confirmed on real
// devices): the custom scheme — nmood:/auth?code=...
import { restoreSupabaseSessionFromUrl } from '@/api/supabaseClient';
import { categorizeOAuthError, OAUTH_ERROR_CATEGORIES } from '@/lib/oauth-diagnostics';

export const AUTH_CALLBACK_PATH = '/auth/callback';
const LEGACY_AUTH_CALLBACK_PATH = '/auth';

export const AUTH_CALLBACK_STAGES = {
  DUPLICATE: 'duplicate',
  NOT_A_CALLBACK: 'not_a_callback',
  NO_SESSION: 'no_session',
  EXCHANGE_FAILED: 'exchange_failed',
  SUCCESS: 'success',
};

const RESULT_STORAGE_KEY = 'nmood:auth_callback_result';

export function parseCallbackPath(rawUrl) {
  if (!rawUrl) return null;
  try {
    const url = new URL(rawUrl);
    if (url.protocol === 'https:' || url.protocol === 'http:') {
      return `${url.pathname}${url.search}${url.hash}`;
    }
    if (url.protocol === 'nmood:') {
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

function pathOnly(target) {
  return (target || '').split('?')[0].split('#')[0];
}

export function isAuthCallbackUrl(rawUrl) {
  const target = parseCallbackPath(rawUrl);
  if (!target) return false;
  const path = pathOnly(target);
  return path === AUTH_CALLBACK_PATH || path === LEGACY_AUTH_CALLBACK_PATH;
}

// The PKCE `code` (or a token_hash) is what is actually single-use — not the
// raw URL string, which can differ slightly (encoding, trailing slash)
// between delivery paths that otherwise carry the identical grant.
function extractDedupeKey(rawUrl) {
  try {
    const url = new URL(rawUrl);
    const params = new URLSearchParams(url.hash ? url.hash.slice(1) : '');
    for (const [key, value] of new URLSearchParams(url.search)) {
      if (!params.has(key)) params.set(key, value);
    }
    return params.get('code') || params.get('token_hash') || rawUrl;
  } catch {
    return rawUrl;
  }
}

// Dedupe keys already claimed this app session. A cold launch on iOS/Android
// delivers the SAME callback to both `appUrlOpen` and `getLaunchUrl` — the
// key is added synchronously (before any `await`) so a second, near-
// simultaneous delivery of the same grant can never start a second exchange.
const processedKeys = new Set();

/**
 * Consume an OAuth callback URL exactly once. Never throws — every outcome
 * (including "this is not a callback URL" and "already consumed") is
 * reported back as a { stage, session, category } result so the caller can
 * show a precise, non-sensitive diagnostic.
 */
export async function consumeAuthCallback(rawUrl) {
  if (!isAuthCallbackUrl(rawUrl)) {
    return { stage: AUTH_CALLBACK_STAGES.NOT_A_CALLBACK, session: null, category: null };
  }

  const key = extractDedupeKey(rawUrl);
  if (processedKeys.has(key)) {
    return { stage: AUTH_CALLBACK_STAGES.DUPLICATE, session: null, category: null };
  }
  processedKeys.add(key);

  try {
    const session = await restoreSupabaseSessionFromUrl(rawUrl);
    if (!session) {
      return { stage: AUTH_CALLBACK_STAGES.NO_SESSION, session: null, category: OAUTH_ERROR_CATEGORIES.CALLBACK_FAILURE };
    }
    return { stage: AUTH_CALLBACK_STAGES.SUCCESS, session, category: null };
  } catch (err) {
    return { stage: AUTH_CALLBACK_STAGES.EXCHANGE_FAILED, session: null, category: categorizeOAuthError(err) };
  }
}

// Finish processing: clean the URL, and hand off to the rest of the app.
// Success and failure notify listeners via the SAME event names the app
// already relies on (AuthContext / SignIn / CreateAccount), so this is a
// drop-in replacement for the previous ad-hoc callback handling.
export function finalizeAuthCallback(result) {
  if (typeof window === 'undefined') return;
  if (result.stage === AUTH_CALLBACK_STAGES.SUCCESS) {
    window.history.replaceState({}, '', '/auth');
    window.dispatchEvent(new PopStateEvent('popstate'));
    window.dispatchEvent(new CustomEvent('nmood:auth-callback', { detail: {} }));
    return;
  }
  if (result.stage === AUTH_CALLBACK_STAGES.EXCHANGE_FAILED || result.stage === AUTH_CALLBACK_STAGES.NO_SESSION) {
    storeAuthCallbackResult(result.stage, result.category);
    window.history.replaceState({}, '', '/auth');
    window.dispatchEvent(new PopStateEvent('popstate'));
    window.dispatchEvent(new CustomEvent('nmood:auth-callback-error'));
  }
  // DUPLICATE / NOT_A_CALLBACK are silent no-ops — no UI change.
}

// A cold launch processes the callback BEFORE React mounts (main.jsx awaits
// the native link handler before rendering), so a live event listener can
// miss it. Store the actual diagnostic (never a bare "timed out" flag) so
// the next screen that mounts can show the real failure once, then clear it.
function storeAuthCallbackResult(stage, category) {
  try {
    window.sessionStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify({ stage, category, ts: Date.now() }));
  } catch {
    // Storage unavailable — a live listener (if mounted) still received the event.
  }
}

export function readAndClearAuthCallbackResult() {
  try {
    const raw = window.sessionStorage.getItem(RESULT_STORAGE_KEY);
    window.sessionStorage.removeItem(RESULT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Test-only: clear in-memory dedupe state between test cases.
export function __resetAuthCallbackCoordinatorForTests() {
  processedKeys.clear();
}
