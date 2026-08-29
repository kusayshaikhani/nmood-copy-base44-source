// Native identity-token sign-in — Sign in with Apple / Google.
//
// No browser, no PKCE, no nmood:// deep link. The identity token (and, for
// Apple, a hashed nonce) is obtained directly from the OS via
// @capgo/capacitor-social-login, then exchanged with Supabase's
// signInWithIdToken grant. This is the ONLY active Google/Apple sign-in path
// on native iOS/Android — see src/api/supabaseClient.js#signInWithOAuth for
// the legacy browser/PKCE path, which remains only for a plain web browser.
import { SocialLogin } from '@capgo/capacitor-social-login';
import { Capacitor } from '@capacitor/core';
import { supabaseAuth } from '@/api/supabaseClient';

// Apple's App ID / bundle identifier — not a secret, matches capacitor.config.ts
// appId and ios/App/App.xcodeproj's PRODUCT_BUNDLE_IDENTIFIER. Must also be
// added to Supabase Dashboard → Authentication → Providers → Apple → Client IDs.
const APPLE_CLIENT_ID = 'com.nmood.app';

let initializePromise = null;

function bytesToHex(bytes) {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function randomNonce() {
  return bytesToHex(crypto.getRandomValues(new Uint8Array(32)));
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
  return Boolean(import.meta.env.VITE_GOOGLE_IOS_CLIENT_ID);
}

function initialize() {
  if (!initializePromise) {
    initializePromise = SocialLogin.initialize({
      apple: { clientId: APPLE_CLIENT_ID },
      google: {
        iOSClientId: import.meta.env.VITE_GOOGLE_IOS_CLIENT_ID || undefined,
        iOSServerClientId: import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID || undefined,
        mode: 'online',
      },
    });
  }
  return initializePromise;
}

/** Sign in with native Apple, then finish authentication with Supabase. */
export async function signInWithNativeApple() {
  await initialize();
  // Apple's ASAuthorizationAppleIDRequest.nonce must be the SHA-256 hash of a
  // raw nonce; the raw nonce is what Supabase verifies against the identity
  // token's echoed (hashed) nonce claim.
  const rawNonce = randomNonce();
  const hashedNonce = await sha256Hex(rawNonce);
  const { result } = await SocialLogin.login({
    provider: 'apple',
    options: { scopes: ['email', 'name'], nonce: hashedNonce },
  });
  if (!result?.idToken) throw new Error('Apple did not return an identity token.');
  return supabaseAuth.signInWithIdToken('apple', result.idToken, rawNonce);
}

/** Sign in with native Google, then finish authentication with Supabase. */
export async function signInWithNativeGoogle() {
  if (!isNativeGoogleConfigured()) {
    throw new Error('Google sign-in is not configured for this app yet.');
  }
  await initialize();
  // No nonce is sent for Google — Supabase's own iOS setup guide recommends
  // enabling "Skip Nonce Check" for the Google provider rather than relying
  // on GIDSignIn's nonce plumbing matching Supabase's expected hash exactly.
  const { result } = await SocialLogin.login({
    provider: 'google',
    options: { scopes: ['email', 'profile'] },
  });
  if (!result?.idToken) throw new Error('Google did not return an identity token.');
  return supabaseAuth.signInWithIdToken('google', result.idToken);
}
