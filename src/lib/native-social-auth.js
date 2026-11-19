// Native identity-token sign-in — Sign in with Apple / Google.
//
// iOS uses native provider identity tokens. Android Apple uses a proof-bound
// browser callback with opaque one-time tickets (never tokens in URLs). For
// Apple, a hashed nonce) is obtained directly from the OS via
// @capgo/capacitor-social-login, then exchanged with Supabase's
// signInWithIdToken grant. This is the ONLY active Google/Apple sign-in path
// on native iOS/Android — see src/api/supabaseClient.js#signInWithOAuth for
// the legacy browser/PKCE path, which remains only for a plain web browser.
import { SocialLogin } from '@capgo/capacitor-social-login';
import { Capacitor } from '@capacitor/core';
import { supabaseAuth, getSupabaseSession } from '@/api/supabaseClient';

// Apple's App ID / bundle identifier — not a secret, matches capacitor.config.ts
// appId and ios/App/App.xcodeproj's PRODUCT_BUNDLE_IDENTIFIER. Must also be
// added to Supabase Dashboard → Authentication → Providers → Apple → Client IDs.
const APPLE_CLIENT_ID = 'com.nmood.app';
// Resolve optional Google configuration only when Google sign-in is requested.
// Keeping it behind globalThis prevents a missing build-time symbol from
// throwing while this module is evaluated and blanking the entire auth UI.
function googleConfig() {
  const packaged = globalThis.__NMOOD_REHEARSAL_GOOGLE_CONFIG__;
  return {
    iOSClientId: packaged?.iOSClientId || import.meta.env.VITE_GOOGLE_IOS_CLIENT_ID || '',
    webClientId: packaged?.webClientId || import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID || '',
  };
}

const initializePromises = new Map();
// A native provider can fail to return a result when Android destroys or
// detaches its credential activity. Do not leave the WebView (and its loading
// screen) waiting forever in that case. The native request may finish later,
// but its result is deliberately ignored after this bounded attempt ends.
const NATIVE_AUTH_TIMEOUT_MS = 120000;

function withNativeAuthTimeout(promise, code) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      const error = new Error('Native sign-in did not return in time.');
      error.code = code;
      reject(error);
    }, NATIVE_AUTH_TIMEOUT_MS);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
}

function bytesToHex(bytes) {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function randomNonce() {
  return bytesToHex(crypto.getRandomValues(new Uint8Array(32)));
}

function googleError(code) {
  const error = new Error(`Google sign-in could not be completed. Reference: ${code}.`);
  error.code = code;
  return error;
}

function googleNativeErrorCode(error) {
  const diagnostic = String(error?.code || '');
  if (diagnostic === 'NMG-G-TIMEOUT') return diagnostic;
  if (/^NMGSDK-(GID|PROVIDER|URL|WEB|AUTH|OSSTATUS|OTHER):(-?\d{1,6}|UNKNOWN)$/.test(diagnostic)) {
    return `NMG-G-NATIVE/${diagnostic.slice(7)}`;
  }
  const raw = `${error?.code || ''} ${error?.message || error || ''}`.toLowerCase();
  if (/-5\b|cancel/.test(raw)) return 'NMG-G-CANCEL';
  if (/network|offline|internet|connection|timed?\s*out/.test(raw)) return 'NMG-G-NETWORK';
  if (/callback url scheme|client.?id|not initialized|not configured/.test(raw)) return 'NMG-G-CONFIG';
  return 'NMG-G-NATIVE';
}

function googleExchangeErrorCode(error) {
  const raw = `${error?.code || ''} ${error?.message || error || ''}`.toLowerCase();
  return /nonce/.test(raw) ? 'NMG-G-NONCE' : 'NMG-G-EXCHANGE';
}

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return bytesToHex(new Uint8Array(digest));
}

export function isNativeSocialAuthAvailable() {
  return Capacitor.isNativePlatform();
}

// The iOS Google OAuth client ID must come from Google Cloud Console — never
// invented here. Until it is configured, Google sign-in fails fast with a
// clear, safe "not configured" error instead of crashing or hanging.
export function isNativeGoogleConfigured() {
  const { iOSClientId, webClientId } = googleConfig();
  return Boolean(webClientId && (Capacitor.getPlatform() !== 'ios' || iOSClientId));
}

export function appleConfiguration() {
  if (Capacitor.getPlatform() !== 'android') return { clientId: APPLE_CLIENT_ID };
  const clientId = (import.meta.env.VITE_APPLE_ANDROID_CLIENT_ID || '').trim();
  const redirectUrl = (import.meta.env.VITE_APPLE_ANDROID_REDIRECT_URL || '').trim();
  let redirect;
  try { redirect = new URL(redirectUrl); } catch { /* fail closed below */ }
  if (clientId !== 'com.nmood.app.web' || redirectUrl !== 'https://vudvrofhxwopgbldunky.supabase.co/functions/v1/apple-android-callback' || !redirect) {
    const error = new Error('Apple sign-in is not configured for Android.');
    error.code = 'NMA-ANDROID-CONFIG';
    throw error;
  }
  return { clientId, redirectUrl };
}

function initialize(provider) {
  if (!initializePromises.has(provider)) {
    const { iOSClientId, webClientId } = googleConfig();
    const options = provider === 'apple'
      ? { apple: appleConfiguration() }
      : { google: {
          iOSClientId,
          iOSServerClientId: webClientId,
          webClientId,
          mode: 'online',
        } };
    const promise = SocialLogin.initialize(options).catch((error) => {
      initializePromises.delete(provider);
      throw error;
    });
    initializePromises.set(provider, promise);
  }
  return initializePromises.get(provider);
}

async function existingMainSession() {
  if (!(typeof __NMOOD_MAIN_DEVICE__ !== 'undefined' && __NMOOD_MAIN_DEVICE__)) return null;
  try {
    const user = await supabaseAuth.getUser();
    return user ? getSupabaseSession() : null;
  } catch (error) {
    if (error?.status === 401) return null;
    throw Object.assign(new Error('Session check unavailable. Try again shortly.'), {code: 'SESSION_UNAVAILABLE'});
  }
}

/** Sign in with native Apple, then finish authentication with Supabase. */
export async function signInWithNativeApple() {
  const existing = await existingMainSession();
  if (existing) return existing;
  const main = typeof __NMOOD_MAIN_DEVICE__ !== 'undefined' && __NMOOD_MAIN_DEVICE__;
  let stage = 'INIT';
  try {
    if (Capacitor.getPlatform() === 'android') {
      appleConfiguration();
      const { signInWithAndroidAppleHandoff } = await import('./android-apple-handoff');
      stage = 'NATIVE';
      const { idToken, rawNonce } = await signInWithAndroidAppleHandoff();
      stage = 'EXCHANGE';
      return await supabaseAuth.signInWithIdToken('apple', idToken, rawNonce);
    }
    await initialize('apple');
    // Apple's ASAuthorizationAppleIDRequest.nonce must be the SHA-256 hash of a
    // raw nonce; the raw nonce is what Supabase verifies against the identity
    // token's echoed (hashed) nonce claim.
    const rawNonce = randomNonce();
    const hashedNonce = await sha256Hex(rawNonce);
    stage = 'NATIVE';
    const { result } = await SocialLogin.login({
      provider: 'apple',
      options: { scopes: ['email', 'name'], nonce: hashedNonce, ...(main ? { nmoodSafeDiagnostic: true } : {}) },
    });
    stage = 'NO-TOKEN';
    if (!result?.idToken) throw new Error('Apple did not return an identity token.');
    stage = 'EXCHANGE';
    return await supabaseAuth.signInWithIdToken('apple', result.idToken, rawNonce);
  } catch (err) {
    if (main) {
      // Preserve only allowlisted Android stage codes, never provider messages.
      // Otherwise callback cancellation/timeout is mislabeled as native Apple failure.
      if (Capacitor.getPlatform() === 'android' && /^NMA-ANDROID-(CONFIG|BUSY|CANCEL|TIMEOUT|RESPONSE|UNAVAILABLE)$/.test(String(err?.code || ''))) {
        const code = err.code;
        throw Object.assign(new Error(`Apple sign-in failed. Reference: ${code}.`), { code });
      }
      const native = String(err?.code || '');
      const suffix = stage === 'NATIVE' && /^NMASDK-(AUTH|WEB|URL|OSSTATUS|OTHER):(-?\d{1,6}|UNKNOWN)$/.test(native) ? '/' + native.slice(7) : '';
      const code = `NMA-A-${stage}${suffix}`;
      throw Object.assign(new Error(`Apple sign-in failed. Reference: ${code}.`), { code });
    }
    // Normalize whatever the native bridge throws (string, plain object,
    // undefined) into a real Error so callers never see an unguarded/raw
    // native rejection — this is what turns a configuration problem into a
    // readable message instead of an unhandled crash.
    throw err instanceof Error ? err : new Error(err?.message || String(err || 'Apple sign-in failed.'));
  }
}

/** Sign in with native Google, then finish authentication with Supabase. */
export async function signInWithNativeGoogle() {
  const existing = await existingMainSession();
  if (existing) return existing;
  if (!isNativeGoogleConfigured()) {
    throw googleError('NMG-G-CONFIG');
  }

  try {
    window.NmoodRecovery?.begin('google-init');
    await initialize('google');
  } catch {
    throw googleError('NMG-G-INIT');
  }

  // Google's native SDK receives the SHA-256 hash while Supabase receives the
  // original raw nonce and verifies it against the ID token's nonce claim.
  const rawNonce = randomNonce();
  const hashedNonce = await sha256Hex(rawNonce);
  let result;
  try {
    window.NmoodRecovery?.begin('google-native', 180000);
    ({ result } = await withNativeAuthTimeout(SocialLogin.login({
      provider: 'google',
      // Bypass a stale restored GID session so the fresh token carries this
      // attempt's nonce.
      // Android's plugin supplies email/profile/openid by default. Explicit
      // scopes require a custom Activity and are rejected by BridgeActivity.
      options: { ...(Capacitor.getPlatform() === 'android' ? {} : { scopes: ['email', 'profile'] }), nonce: hashedNonce,
        ...(typeof __NMOOD_MAIN_DEVICE__ !== 'undefined' && __NMOOD_MAIN_DEVICE__ ? { nmoodFreshNonce: true } : { forcePrompt: true }),
        ...(typeof __NMOOD_MAIN_DEVICE__ !== 'undefined' && __NMOOD_MAIN_DEVICE__ ? { nmoodSafeDiagnostic: true } : {}),
      },
    }), 'NMG-G-TIMEOUT'));
  } catch (error) {
    throw googleError(googleNativeErrorCode(error));
  }

  if (!result?.idToken) throw googleError('NMG-G-NO-TOKEN');

  try {
    window.NmoodRecovery?.begin('google-exchange');
    return await supabaseAuth.signInWithIdToken('google', result.idToken, rawNonce);
  } catch (error) {
    throw googleError(googleExchangeErrorCode(error));
  }
}

// Destructive actions require a fresh provider interaction. This deliberately
// bypasses existingMainSession and never replaces the signed-in Nmood session.
export async function nativeDeletionProof(provider) {
  if (!Capacitor.isNativePlatform() || !['apple', 'google'].includes(provider)) {
    throw new Error('Provider reauthentication requires the Nmood mobile app.');
  }
  try {
    if (provider === 'apple' && Capacitor.getPlatform() === 'android') {
      appleConfiguration();
      const { signInWithAndroidAppleHandoff } = await import('./android-apple-handoff');
      const { idToken, rawNonce } = await signInWithAndroidAppleHandoff();
      return { provider, idToken, nonce: rawNonce };
    }
    await initialize(provider);
    const nonce = randomNonce();
    const hashedNonce = await sha256Hex(nonce);
    const { result } = await SocialLogin.login({ provider, options: {
      nonce: hashedNonce,
      ...(provider === 'apple' ? { scopes: ['email', 'name'] } : Capacitor.getPlatform() === 'android' ? {} : { scopes: ['email', 'profile'] }),
      nmoodFreshNonce: true,
      nmoodSafeDiagnostic: true,
    } });
    if (!result?.idToken) throw Error('PROOF_MISSING');
    // Installed iOS plugin's legacy mode returns the one-time authorization
    // code in accessToken.token; it is NOT an Apple access/refresh token.
    const code = provider === 'apple' ? result.authorizationCode || (Capacitor.getPlatform() === 'ios' ? result.accessToken?.token : undefined) : undefined;
    return { provider, idToken: result.idToken, nonce, ...(code ? { authorizationCode: code } : {}) };
  } catch {
    throw new Error('Reauthentication was not completed. Your account has not been deleted.');
  }
}
