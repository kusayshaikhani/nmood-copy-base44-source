// Supabase browser client for Nmood. Service-role keys must never be used here.
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { getAppLink } from '@/lib/app-links';

const DEFAULT_SUPABASE_URL = 'https://nhyrhvwhsxbtidigpeel.supabase.co';
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_4VD3jwwZIvkDiIkQ9F1Oqw_0tiodG5R';

const baseUrl = (import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL)?.replace(/\/$/, '');
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || DEFAULT_SUPABASE_PUBLISHABLE_KEY;
const sessionKey = 'nmood.supabase.session';


function requireConfig() {
  if (!baseUrl || !publishableKey) throw new Error('We can’t connect right now. Please try again shortly.');
}


export function getSupabaseSession() {
  try { return JSON.parse(window.localStorage.getItem(sessionKey) || 'null'); } catch { return null; }
}


export function setSupabaseSession(session) {
  if (!session?.access_token) throw new Error('A valid session is required.');
  window.localStorage.setItem(sessionKey, JSON.stringify(session));
}


export function clearSupabaseSession() {
  window.localStorage.removeItem(sessionKey);
}


export async function restoreSupabaseSessionFromUrl(rawUrl) {
  if (typeof window === 'undefined' && !rawUrl) return null;
  const callbackUrl = rawUrl ? new URL(rawUrl) : window.location;
  const values = new URLSearchParams(callbackUrl.hash.slice(1));
  for (const [key, value] of new URLSearchParams(callbackUrl.search)) {
    if (!values.has(key)) values.set(key, value);
  }
  const errorDescription = values.get('error_description') || values.get('error');
  if (errorDescription) throw new Error(`Nmood could not complete sign in: ${errorDescription}`);

  const isRecovery = (callbackUrl.pathname || '').includes('/reset-password') || values.get('type') === 'recovery';

  const access_token = values.get('access_token');
  if (access_token) {
    const session = { access_token, refresh_token: values.get('refresh_token'), token_type: values.get('token_type') || 'bearer', expires_in: Number(values.get('expires_in') || 0) };
    setSupabaseSession(session);
    if (!rawUrl && !isRecovery) window.history.replaceState({}, document.title, window.location.pathname);
    return session;
  }

  const tokenHash = values.get('token_hash');
  const type = values.get('type');
  if (tokenHash && type) {
    const session = await request('/auth/v1/verify', {
      method: 'POST',
      body: JSON.stringify({ token_hash: tokenHash, type }),
    });
    if (session?.access_token) {
      setSupabaseSession(session);
      if (!rawUrl && !isRecovery) window.history.replaceState({}, document.title, window.location.pathname);
      return session;
    }
  }

  const code = values.get('code');
  if (!code) return null;
  const codeVerifier = window.sessionStorage.getItem('nmood.supabase.pkce_verifier');
  const session = await request('/auth/v1/token?grant_type=pkce', {
    method: 'POST',
    body: JSON.stringify({ auth_code: code, code_verifier: codeVerifier || undefined }),
  });
  setSupabaseSession(session);
  window.sessionStorage.removeItem('nmood.supabase.pkce_verifier');
  if (!rawUrl && !isRecovery) window.history.replaceState({}, document.title, window.location.pathname);
  return session;
}


async function request(path, options = {}) {
  requireConfig();
  const session = getSupabaseSession();
  const response = await fetch(baseUrl + path, { ...options, headers: { apikey: publishableKey, Authorization: 'Bearer ' + (session?.access_token || publishableKey), 'Content-Type': 'application/json', ...(options.headers || {}) } });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message = body?.message || body?.error_description || body?.msg;
    throw new Error(message && !/supabase/i.test(message) ? message : 'Nmood could not complete that request. Please try again.');
  }
  return body;
}


export const supabaseAuth = {
  async signInWithPassword(email, password) {
    const session = await request('/auth/v1/token?grant_type=password', { method: 'POST', body: JSON.stringify({ email, password }) });
    setSupabaseSession(session);
    return session;
  },
  async signUp(email, password, data = {}) {
    const result = await request('/auth/v1/signup', { method: 'POST', body: JSON.stringify({ email, password, data, options: { emailRedirectTo: getAppLink('/auth') } }) });
    if (result?.access_token) setSupabaseSession(result);
    return result;
  },
  async resetPasswordForEmail(email) {
    // The user resets entirely in-app with a one-time code (see ForgotPassword.jsx) —
    // this never sends a tappable link. redirect_to is kept only as a dashboard
    // fallback destination in case the email template has not yet been switched
    // to the {{ .Token }} OTP variable (see project docs for the required change).
    const redirectTarget = getAppLink('/reset-password');
    const redirectTo = encodeURIComponent(redirectTarget);
    return request('/auth/v1/recover?redirect_to=' + redirectTo, { method: 'POST', body: JSON.stringify({ email }) });
  },
  // Verifies the one-time recovery code emailed to the user and returns a
  // recovery-scoped session. Only after this succeeds is `updatePassword`
  // allowed to change the password.
  async verifyRecoveryOtp(email, token) {
    const session = await request('/auth/v1/verify', {
      method: 'POST',
      body: JSON.stringify({ type: 'recovery', email, token }),
    });
    if (!session?.access_token) throw new Error('Nmood could not verify that code. Please try again.');
    setSupabaseSession(session);
    return session;
  },
  async updatePassword(password) {
    return request('/auth/v1/user', { method: 'PUT', body: JSON.stringify({ password }) });
  },
  async signInWithOAuth(provider) {
    requireConfig();
    const url = new URL(baseUrl + '/auth/v1/authorize');
    url.searchParams.set('provider', provider);
    const isNative = Capacitor.isNativePlatform();
    if (isNative && window.crypto?.subtle) {
      const bytes = crypto.getRandomValues(new Uint8Array(32));
      const verifier = btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
      const challenge = btoa(String.fromCharCode(...new Uint8Array(digest))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      window.sessionStorage.setItem('nmood.supabase.pkce_verifier', verifier);
      url.searchParams.set('flow_type', 'pkce');
      url.searchParams.set('code_challenge', challenge);
      url.searchParams.set('code_challenge_method', 's256');
    }
    // Both native and web use the same HTTPS Universal Link callback — one
    // coordinator (auth-callback-coordinator.js) consumes it exactly once,
    // whether it arrives via a mounted /auth/callback route (web) or a
    // Capacitor appUrlOpen/getLaunchUrl deep link (native).
    url.searchParams.set('redirect_to', getAppLink('/auth/callback'));
    // Native: the WKWebView/WebView is NOT a secure system browser — Google
    // rejects it outright (disallowed_useragent) and Apple can behave
    // unreliably. Hand the URL to the OS-level secure browser (ASWebAuthentication
    // /Custom Tabs via the Capacitor Browser plugin) instead of navigating the
    // app's own WebView away with window.location.assign. The OAuth provider
    // redirects to the Universal Link on completion; iOS/Android route that
    // straight back into this app (Associated Domains / App Links), where
    // native-recovery-link.js catches it via appUrlOpen, hands it to the
    // coordinator, then closes this browser.
    if (isNative) {
      await Browser.open({ url: url.toString() });
      return;
    }
    window.location.assign(url.toString());
  },
  async signOut() {
    await request('/auth/v1/logout', { method: 'POST' }).catch(() => {});
    clearSupabaseSession();
  },
  async getUser() {
    const user = await request('/auth/v1/user');
    const session = getSupabaseSession();
    if (session?.access_token) window.localStorage.setItem(sessionKey, JSON.stringify({ ...session, user }));
    return user;
  },
};


export async function callSupabaseRpc(functionName, params = {}) {
  return request('/rest/v1/rpc/' + functionName, { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify(params) });
}


// Returns only the signed-in member's own blocks; database policies enforce ownership.
export async function getMyMemberBlocks() {
  return request('/rest/v1/member_blocks?select=blocker_id,blocked_member_id,created_at&order=created_at.desc');
}


export async function getMyPrivateConversations() {
  const userId = getSupabaseSession()?.user?.id;
  if (!userId) return [];
  const filter = encodeURIComponent(`member_a_id.eq.${userId},member_b_id.eq.${userId}`);
  return request(`/rest/v1/private_conversations?select=*&or=(${filter})&order=updated_at.desc`);
}


export async function uploadProfilePhoto(file) {
  requireConfig();
  const session = getSupabaseSession();
  const userId = session?.user?.id;
  if (!session?.access_token || !userId) throw new Error('Please sign in before uploading a photo.');
  const extension = file.name?.split('.').pop()?.toLowerCase() || 'jpg';
  const path = userId + '/' + crypto.randomUUID() + '.' + extension;
  const response = await fetch(baseUrl + '/storage/v1/object/profile-photos/' + path, { method: 'POST', headers: { apikey: publishableKey, Authorization: 'Bearer ' + session.access_token, 'Content-Type': file.type || 'image/jpeg', 'x-upsert': 'false' }, body: file });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.message || 'We could not upload that photo.');
  return baseUrl + '/storage/v1/object/public/profile-photos/' + path;
}
