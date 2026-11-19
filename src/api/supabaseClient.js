import { usesMainKeychain, mainSessionVault, hydrateMainSession } from '@/lib/main-session-storage';
import {ISOLATED_CUSTOMER_BUILD,customerSession} from '@/lib/isolated-customer/runtime.mjs';
import {ISOLATED_APP_BUILD, isolatedAppAdapters, isolatedAdminDelete} from '@/lib/isolated-app/active.mjs';
import { acceptDestinationImage } from '@/lib/destination-session';
import { destinationRequest } from '@/lib/destination-transport';
import { beginDestinationRequest, acceptDestinationRequest, destinationOwnsSession } from '@/lib/destination-session';
import { passportRuntime } from '@/lib/passport-runtime';
import { beginPassportRequest, finishPassportRequest } from '@/lib/passport-adapters';
import { REGION_ENABLED } from '@/lib/region-config';
import { verificationFailure } from '@/lib/verification-recovery';
import { membershipErrorMessage } from '@/lib/membership-presentation';
import { requestSubmission, finishSubmission } from '@/lib/request-submission';
// Supabase browser client for Nmood. Service-role keys must never be used here.
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { getAppLink, NATIVE_OAUTH_REDIRECT, isNmoodCandidateOrigin } from '@/lib/app-links';
import { supabaseConfig } from '@/config/supabase-config';
import { localSafetyDecision } from '@/lib/local-safety-signals';

const { baseUrl, publishableKey } = supabaseConfig;
const sessionKey = 'nmood.supabase.session';
const refreshLeewaySeconds = 60;

export function getEmailConfirmationRedirect() {
  return Capacitor.isNativePlatform() ? NATIVE_OAUTH_REDIRECT : getAppLink('/auth');
}

function withEmailConfirmationRedirect(path) {
  return path + '?redirect_to=' + encodeURIComponent(getEmailConfirmationRedirect());
}

let refreshPromise = null;
let sessionGeneration = 0;


function requireConfig() {
  if (!baseUrl || !publishableKey) throw new Error('We can’t connect right now. Please try again shortly.');
}


export function getSupabaseSession() {
  if (ISOLATED_CUSTOMER_BUILD) return customerSession().snapshot();
  if (ISOLATED_APP_BUILD) return null; // Never read the ordinary app session in an isolated build.
  if (usesMainKeychain()) return mainSessionVault.snapshot();
  try { return JSON.parse(window.localStorage.getItem(sessionKey) || 'null'); } catch { return null; }
}


export function setSupabaseSession(session) {
  if (ISOLATED_APP_BUILD) throw Error('ISOLATED_SESSION_STORAGE_DENIED');
  if (!session?.access_token) throw new Error('A valid session is required.');
  const expiresIn = Number(session.expires_in || 0);
  const normalizedSession = {
    ...session,
    ...(session.expires_at || !expiresIn
      ? {}
      : { expires_at: Math.floor(Date.now() / 1000) + expiresIn }),
  };
  const changedActor = getSupabaseSession()?.user?.id !== normalizedSession.user?.id;
  if (changedActor) sessionGeneration += 1;
  const saved = usesMainKeychain() ? mainSessionVault.save(normalizedSession) : window.localStorage.setItem(sessionKey, JSON.stringify(normalizedSession));
  if (changedActor && passportRuntime.enabled) { passportRuntime.withdraw(); window.dispatchEvent(new Event('nmood:passport-session-changed')); }
  return saved;
}


export function clearSupabaseSession() {
  if (ISOLATED_CUSTOMER_BUILD) return customerSession().clear();
  if (ISOLATED_APP_BUILD) return; // Preserve the ordinary app account/session.
  if (passportRuntime.enabled) { passportRuntime.withdraw(); window.dispatchEvent(new Event('nmood:passport-session-changed')); }
  sessionGeneration += 1;
  window.localStorage.removeItem(sessionKey);
  if (usesMainKeychain()) return mainSessionVault.save(null);
}


export async function refreshSupabaseSession() {
  await hydrateMainSession();
  const currentSession = getSupabaseSession();
  if (!currentSession?.refresh_token) {
    await clearSupabaseSession();
    throw Object.assign(new Error('Your session has expired. Please sign in again.'), {status: 401});
  }

  if (refreshPromise) return refreshPromise;

  const generation = sessionGeneration;
  refreshPromise = (async () => {
    requireConfig();
    const response = await fetch(baseUrl + '/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      headers: { apikey: publishableKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: currentSession.refresh_token }),
    });
    const body = await response.json().catch(() => null);
    if (generation !== sessionGeneration) throw new Error('Session changed.');
    if (!response.ok || !body?.access_token) {
      if (![400, 401].includes(response.status)) throw Object.assign(new Error('Session renewal unavailable. Try again shortly.'), {status: 503});
      await clearSupabaseSession();
      throw Object.assign(new Error('Your session has expired. Please sign in again.'), {status: 401});
    }

    const refreshedSession = {
      ...currentSession,
      ...body,
      expires_at: body.expires_at || (Number(body.expires_in) > 0 ? Math.floor(Date.now()/1000) + Number(body.expires_in) : currentSession.expires_at),
      refresh_token: body.refresh_token || currentSession.refresh_token,
      user: body.user || currentSession.user,
    };
    await setSupabaseSession(refreshedSession);
    return getSupabaseSession();
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}


async function getRequestSession() {
  await hydrateMainSession();
  const session = getSupabaseSession();
  if (!session?.access_token || !session.expires_at) return session;
  const nowSeconds = Math.floor(Date.now() / 1000);
  return session.expires_at <= nowSeconds + refreshLeewaySeconds
    ? refreshSupabaseSession()
    : session;
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
    await setSupabaseSession(session);
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
      await setSupabaseSession(session);
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
  await setSupabaseSession(session);
  window.sessionStorage.removeItem('nmood.supabase.pkce_verifier');
  if (!rawUrl && !isRecovery) window.history.replaceState({}, document.title, window.location.pathname);
  return session;
}


function nativeHeaders(headers = {}) {
  const entries = Object.entries(headers);
  return {
    get(name) {
      const target = String(name).toLowerCase();
      const entry = entries.find(([key]) => String(key).toLowerCase() === target);
      return entry?.[1] ?? null;
    },
  };
}

function usesAndroidOnboardingTransport(path) {
  // Android WebView can cancel this authenticated RPC immediately after its
  // successful CORS preflight. Keep the native transport limited to the one
  // onboarding call proven to be affected; web and iOS remain unchanged.
  return Capacitor.getPlatform?.() === 'android'
    && path === '/rest/v1/rpc/ensure_my_onboarding_profile';
}

async function sendAndroidOnboardingRequest(url, options) {
  if (options.signal?.aborted) throw new Error('Request cancelled.');
  const response = await CapacitorHttp.request({
    url,
    method: options.method || 'POST',
    headers: options.headers,
    data: options.body,
    responseType: 'json',
    disableRedirects: true,
    connectTimeout: 10000,
    readTimeout: 20000,
  });
  // Native requests cannot be aborted once started. Do not accept a late or
  // redirected response after the onboarding screen/session has changed.
  if (options.signal?.aborted || (response.url && response.url !== url)) {
    throw new Error('Request cancelled.');
  }
  return {
    status: response.status,
    ok: response.status >= 200 && response.status < 300,
    headers: nativeHeaders(response.headers),
    json: async () => response.data,
  };
}

function usesAndroidNativeFunctionTransport(functionName) {
  // Android WebView has the same authenticated-preflight failure for the
  // protected gallery signer as it does for the onboarding RPC. Keep the
  // native transport limited to this read-only, JWT-protected endpoint.
  return Capacitor.getPlatform() === 'android'
    && functionName === 'main-profile-gallery';
}

async function sendAndroidFunctionRequest(url, { headers, body, signal }) {
  if (signal?.aborted) throw new Error('Request cancelled.');
  const response = await CapacitorHttp.request({
    url,
    method: 'POST',
    headers,
    data: body,
    responseType: 'json',
    disableRedirects: true,
    connectTimeout: 10000,
    readTimeout: 20000,
  });
  if (signal?.aborted || (response.url && response.url !== url)) {
    throw new Error('Request cancelled.');
  }
  return {
    status: response.status,
    ok: response.status >= 200 && response.status < 300,
    headers: nativeHeaders(response.headers),
    json: async () => response.data,
  };
}

async function request(path, options = {}) {
  if (ISOLATED_APP_BUILD) throw Error('ISOLATED_OPERATION_NOT_IMPLEMENTED');
  requireConfig();
  const isPublicAuthRequest = [
    '/auth/v1/token', '/auth/v1/signup', '/auth/v1/resend', '/auth/v1/recover', '/auth/v1/verify',
  ].some((prefix) => path.startsWith(prefix));
  let session = isPublicAuthRequest ? null : await getRequestSession();
  const { expectedUserId, ...fetchOptions } = options;
  const destinationTicket = beginDestinationRequest(path, session?.user?.id);
  const passportTicket = destinationTicket || destinationOwnsSession(session?.user?.id) ? null : beginPassportRequest(passportRuntime, path, session?.user?.id);
  const transport = destinationRequest(path, fetchOptions, destinationTicket);
  const send = () => {
    if (destinationTicket && destinationTicket.actor !== session?.user?.id) throw new Error('Session changed.');
    if (expectedUserId && (session?.user?.id !== expectedUserId || getSupabaseSession()?.user?.id !== expectedUserId)) throw new Error('Gallery session changed.');
    const url = baseUrl + transport.path;
    const requestOptions = {
      ...transport.options,
      headers: {
        apikey: publishableKey,
        Authorization: 'Bearer ' + (session?.access_token || publishableKey),
        'Content-Type': 'application/json',
        ...(options.headers || {}),
        ...(destinationTicket ? {'X-Nmood-Destination-Revision': String(destinationTicket.ticket.revision)} : {}),
      },
    };
    return usesAndroidOnboardingTransport(transport.path)
      ? sendAndroidOnboardingRequest(url, requestOptions)
      : fetch(url, requestOptions);
  };
  let response = await send();
  if (!isPublicAuthRequest && response.status === 401 && session?.refresh_token) {
    session = await refreshSupabaseSession();
    response = await send();
  }
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message = membershipErrorMessage(body?.message || body?.error_description || body?.msg, body?.details);
    const error = new Error(message && !/supabase/i.test(message) ? message : 'Nmood could not complete that request. Please try again.');
    error.status = response.status;
    error.code = body?.code || body?.error_code || null;
    const retryAfter = Number(response.headers?.get?.('retry-after'));
    error.retryAfterSeconds = Number.isFinite(retryAfter) && retryAfter > 0
      ? Math.ceil(retryAfter)
      : null;
    throw error;
  }
  acceptDestinationRequest(destinationTicket, getSupabaseSession()?.user?.id, body);
  finishPassportRequest(passportRuntime, passportTicket, getSupabaseSession()?.user?.id);
  return destinationTicket ? body.data : body;
}


export const supabaseAuth = {
  async signInWithPassword(email, password) {
    if (ISOLATED_CUSTOMER_BUILD) return customerSession().signin(email,password);
    const session = await request('/auth/v1/token?grant_type=password', { method: 'POST', body: JSON.stringify({ email, password }) });
    await setSupabaseSession(session);
    return session;
  },
  async signUp(email, password, data = {}) {
    if (ISOLATED_CUSTOMER_BUILD) return customerSession().signup(email,password);
    const result = await request(withEmailConfirmationRedirect('/auth/v1/signup'), { method: 'POST', body: JSON.stringify({ email, password, data }) });
    if (result?.access_token) await setSupabaseSession(result);
    return result;
  },
  async resendSignupEmail(email) {
    if(ISOLATED_CUSTOMER_BUILD)return customerSession().resendSignup(email);
    try {
      return await request(withEmailConfirmationRedirect('/auth/v1/resend'), {
        method: 'POST',
        body: JSON.stringify({ type: 'signup', email }),
      });
    } catch (cause) {
      const failure = verificationFailure(cause);
      const error = new Error(failure.message);
      error.code = cause?.code || null;
      error.verificationReason = failure.code;
      error.status = cause?.status || null;
      error.retryAfterSeconds = cause?.retryAfterSeconds || null;
      throw error;
    }
  },
  async resetPasswordForEmail(email) {
    // Code-only recovery. The Reset Password email template must render
    // {{ .Token }}; no redirect URL is sent for new recovery requests.
    return request('/auth/v1/recover', { method: 'POST', body: JSON.stringify({ email }) });
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
    await setSupabaseSession(session);
    return session;
  },
  // Reauthenticate against Supabase before an in-session password update.
  // This deliberately replaces the local session with Supabase's result; it
  // never reads or caches the password itself.
  async reauthenticateWithPassword(email, password, expectedUserId) {
    const session = await request('/auth/v1/token?grant_type=password', {
      method: 'POST', body: JSON.stringify({ email, password }),
    });
    if (!session?.access_token || !session?.user?.id || (expectedUserId && session.user.id !== expectedUserId)) {
      await clearSupabaseSession();
      throw new Error('Your session could not be verified. Please sign in again.');
    }
    await setSupabaseSession(session);
    return session;
  },
  async updatePassword(password, expectedUserId) {
    const result = await request('/auth/v1/user', { method: 'PUT', body: JSON.stringify({ password }) });
    const updatedUser = result?.user || result;
    if (!updatedUser?.id || (expectedUserId && updatedUser.id !== expectedUserId)) {
      throw new Error('Your password change could not be confirmed. Please sign in again.');
    }
    // Keep the active session associated with the verified account after the
    // update, without retaining any password or credential in application storage.
    const session = getSupabaseSession();
    if (session?.access_token) await setSupabaseSession({ ...session, user: updatedUser });
    return updatedUser;
  },
  async signInWithOAuth(provider) {
    // Candidate OAuth callbacks are not allowlisted. Fail here rather than
    // silently moving acceptance to production; password sign-in stays local.
    if (!Capacitor.isNativePlatform() && isNmoodCandidateOrigin(window.location.origin)) {
      throw Object.assign(new Error('Use email and password to sign in to this candidate. Social sign-in would leave the candidate.'), {code:'CANDIDATE_OAUTH_UNAVAILABLE'});
    }
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
    // Native callbacks must return to the installed app; browser callbacks
    // must return to the already-allowlisted HTTPS route in the same browser.
    // A custom scheme on web strands the browser session outside this page.
    url.searchParams.set('redirect_to', isNative ? NATIVE_OAUTH_REDIRECT : getAppLink('/auth'));
    // Native: the WKWebView/WebView is NOT a secure system browser — Google
    // rejects it outright (disallowed_useragent) and Apple can behave
    // unreliably. Hand the URL to the OS-level secure browser (ASWebAuthentication
    // /Custom Tabs via the Capacitor Browser plugin) instead of navigating the
    // app's own WebView away with window.location.assign. The OAuth provider
    // redirects to nmood://auth on completion, which native-recovery-link.js
    // catches via appUrlOpen, hands it to the single callback coordinator,
    // then closes this browser.
    if (isNative) {
      await Browser.open({ url: url.toString() });
      return;
    }
    window.location.assign(url.toString());
  },
  // Native identity-token sign-in (Sign in with Apple / Google via
  // @capgo/capacitor-social-login) — no browser, no PKCE, no nmood:// deep
  // link. See src/lib/native-social-auth.js for the native-side call.
  async signInWithIdToken(provider, idToken, nonce) {
    requireConfig();
    const body = { provider, id_token: idToken };
    if (nonce) body.nonce = nonce;
    const session = await request('/auth/v1/token?grant_type=id_token', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    await setSupabaseSession(session);
    return session;
  },
  async signOut() {
    // Clear synchronously before waiting on storage or network. A pending
    // Keychain hydration must not resurrect an accepted deletion session.
    if (ISOLATED_CUSTOMER_BUILD) return customerSession().clear();
    const session = getSupabaseSession();
    await clearSupabaseSession();
    if (!session?.access_token) return;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    try { await fetch(baseUrl + '/auth/v1/logout', { method: 'POST', headers: { apikey: publishableKey, Authorization: 'Bearer ' + session.access_token }, signal: controller.signal }); } catch { /* Local logout already completed. */ } finally { clearTimeout(timer); }
  },
  async getUser() {
    await hydrateMainSession();
    // Upgrade an existing main WebView session once, without opening a provider.
    if (usesMainKeychain() && !getSupabaseSession()) {
      const legacy = window.localStorage.getItem(sessionKey);
      if (legacy) await setSupabaseSession(JSON.parse(legacy));
    }
    if (ISOLATED_CUSTOMER_BUILD) {if(!customerSession().snapshot())return null;return (await customerSession().verified()).user;}
    if (!getSupabaseSession()?.access_token) return null;
    const generation = sessionGeneration;
    let user;
    try { user = await request('/auth/v1/user'); } catch (error) {
      if (error?.status === 401 && generation === sessionGeneration) await clearSupabaseSession();
      throw error;
    }
    if (generation !== sessionGeneration) throw Error('Session changed.');
    const session = getSupabaseSession();
    if (session?.access_token) await setSupabaseSession({ ...session, user });
    if (usesMainKeychain()) window.localStorage.removeItem(sessionKey);
    return user;
  },
};


export async function callSupabaseRpc(functionName, params = {}, options = {}) {
  if(ISOLATED_APP_BUILD){
    const client=isolatedAppAdapters().client;
    if(ISOLATED_CUSTOMER_BUILD){
      if(functionName==='send_pal_request')return client.social({action:'request',peer:params.p_receiver_id,message:params.p_message||''});
      if(functionName==='respond_to_pal_request')return client.social({action:'respond',id:params.p_request_id,accept:params.p_accept});
      if(functionName==='cancel_my_pal_request')return client.social({action:'cancel',id:params.p_request_id});
      if(functionName==='remove_my_pal_connection')return client.social({action:'remove',peer:params.p_pal_id});
      const groupRpcs={nmood_join_circle:['Circle','join'],nmood_join_experience:['Experience','join'],nmood_get_circle_membership_state:['Circle','state'],nmood_get_experience_attendance_state:['Experience','state'],nmood_leave_circle:['Circle','leave'],nmood_leave_experience:['Experience','leave'],nmood_respond_circle_membership:['Circle','respond'],nmood_respond_experience_attendance:['Experience','respond'],nmood_remove_circle_member:['Circle','remove'],nmood_remove_experience_attendee:['Experience','remove']};
      if(groupRpcs[functionName]){const [kind,action]=groupRpcs[functionName];return client.groups({kind,action,...(params.p_circle_id||params.p_experience_id?{id:params.p_circle_id||params.p_experience_id}:{}),...(params.p_membership_id||params.p_attendance_id?{membership:params.p_membership_id||params.p_attendance_id}:{}),...(action==='respond'?{approve:params.p_approve}:{})});}

      const own=async value=>{if(value.photo_media_id)value.photo_url=await isolatedAppAdapters().media.display(value.photo_media_id);return value;};
      if(['ensure_my_onboarding_profile','nmood_get_my_private_profile','nmood_get_my_profile_details','nmood_get_my_family_preferences'].includes(functionName))return own(await client.profile({action:'read'}));
      if(functionName==='nmood_get_my_onboarding_settings')return client.profile({action:'settings.read'});
      if(functionName==='nmood_save_my_onboarding_settings')return client.profile({action:'settings.save',updates:params.p_changes});
      if(functionName==='complete_my_onboarding')return own(await client.profile({action:'complete'}));
      if(['save_my_onboarding_progress','nmood_save_my_family_preferences','nmood_save_my_profile_details'].includes(functionName)){const updates={...params.p_updates};if('photo_url' in updates){updates.photo_media_id=isolatedAppAdapters().media.idFor(updates.photo_url);delete updates.photo_url;}return own(await client.profile({action:'save',updates}));}
    }
    if(functionName==='nmood_block_member'||functionName==='nmood_unblock_member')return client.blocks({action:functionName==='nmood_block_member'?'block':'unblock',id:params.p_member_id});
    if(functionName==='nmood_list_main_posts')return params.p_before_id?[]:client.posts({action:'list',id:params.p_id});
    if(functionName==='nmood_publish_main_post')return client.posts({action:'publish',id:params.p_request_id,data:params.p_data});
    if(functionName==='nmood_update_main_post')return client.posts({action:'update',id:params.p_id,data:params.p_data});
    if(functionName==='nmood_delete_main_post')return client.posts({action:'delete',id:params.p_id});
    if(functionName==='nmood_list_discoverable_members')return (await client.records({action:'list',entity:'Member'})).filter(r=>r.owner_id!==client.actorId);
    if(['ensure_my_onboarding_profile','nmood_get_my_private_profile','nmood_get_my_profile_details'].includes(functionName))return (await client.session()).member;
    if(['nmood_get_member_profile','nmood_get_member_profile_details'].includes(functionName)){const profile=await client.records({action:'get',entity:'Member',id:params.p_member_id});return functionName==='nmood_get_member_profile'?{tier:'full',blocked:false,profile}:profile;}

    if(functionName==='nmood_get_my_membership_status')return client.membership();
    if(functionName==='admin_platform_overview')return client.adminRead({action:'overview'});
    if(functionName==='is_platform_admin')return (await client.session()).user.role==='admin';
    if(functionName==='admin_list_members')return client.adminRead({action:'members'});
    if(functionName==='nmood_mark_private_conversation_read')return client.conversations({action:'read',conversation_id:params.p_conversation_id});
    if(functionName==='nmood_set_private_typing')return client.conversations({action:'typing',conversation_id:params.p_conversation_id,typing:params.p_typing});
    throw Error('ISOLATED_OPERATION_NOT_IMPLEMENTED');
  }
  const attempt = requestSubmission(functionName, params, getSupabaseSession()?.user?.id);
  try {
    const result = await request('/rest/v1/rpc/' + functionName, { ...options, method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify(attempt?.params || params) });
    finishSubmission(attempt);
    return result;
  } catch (error) {
    finishSubmission(attempt, error);
    throw error;
  } finally {
    if (['send_pal_request', 'nmood_join_circle', 'nmood_join_experience', 'cancel_my_pal_request'].includes(functionName) && typeof window !== 'undefined') {
      window.dispatchEvent(new Event('nmood:request-policy-changed'));
    }
  }
}


export async function invokeSupabaseFunction(functionName, payload = {}, options = {}) {
  if (ISOLATED_APP_BUILD) {
    if (functionName === 'admin-hard-delete') return isolatedAdminDelete(payload);
    throw Error('ISOLATED_OPERATION_NOT_IMPLEMENTED');
  }
  requireConfig();
  const receiptRead = functionName === 'deletion-status';
  let session = receiptRead ? null : await getRequestSession();
  if (!receiptRead && !session?.access_token) throw new Error('Please sign in to continue.');
  const send = () => {
    const url = baseUrl + '/functions/v1/' + functionName;
    const request = {
      method: 'POST',
      headers: { apikey: publishableKey, ...(session?.access_token ? {Authorization: 'Bearer ' + session.access_token} : {}), 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: options.signal,
    };
    return usesAndroidNativeFunctionTransport(functionName)
      ? sendAndroidFunctionRequest(url, request)
      : fetch(url, request);
  };
  let response = await send();
  if (response.status === 401 && session?.refresh_token && options.retryAuth !== false) {
    session = await refreshSupabaseSession();
    response = await send();
  }
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(body?.error || 'function_unavailable');
    error.status = response.status;
    error.error = body?.error;
    error.diagnostic = body?.diagnostic;
    if(functionName==='nmood-assistant'){
      error.next_available_at=body?.next_available_at;error.limit=body?.limit;error.tier=body?.tier;
    }
    if (functionName === 'main-admin-member-delete' && ['PLAN_CHANGED_REVIEW_REQUIRED','SERVER_PERMISSION_BLOCKED','SHARED_DEPENDENCY_BLOCKED','OWNED_DATA_REMAINS','TRANSACTION_FAILED'].includes(body?.failure_category)) error.failure_category = body.failure_category;
    if(functionName==='phone-verification' && ['authentication','permission','service_not_found','configuration','timeout','network','dns','tls','provider_server','malformed_response','rejected'].includes(body?.reason))error.reason=body.reason;
    error.retry_after = body?.retry_after;
    throw error;
  }
  return body;
}


/**
 * Read-only PostgREST select. `query` is everything after the table name,
 * e.g. `select=*&created_at=gte.2024-01-01&order=created_at.desc`.
 * Row visibility is decided by RLS, never by this helper.
 */
export async function supabaseSelect(table, query = 'select=*', options = {}) {
  return request(`/rest/v1/${table}?${query}`, options);
}


// Returns only the signed-in member's own blocks; database policies enforce ownership.
export async function getMyMemberBlocks() {
  if(ISOLATED_APP_BUILD)return isolatedAppAdapters().client.blocks({action:"list"});
  return callSupabaseRpc('nmood_list_my_blocks');
}


export async function getMySafetyNotifications() {
  return request('/rest/v1/safety_member_notifications?select=id,kind,title,body,read_at,created_at&order=created_at.desc&limit=100');
}

export async function getMyGroupCancellationNotifications() {
  return request('/rest/v1/group_cancellation_notifications?select=id,scope,source_id,title,body,created_at&order=created_at.desc&limit=100');
}

export async function getMyActivityNotifications() {
  return callSupabaseRpc('nmood_list_my_notifications', { p_limit: 200 });
}

export const getMyNotificationUnreadCount = () => callSupabaseRpc('nmood_my_notification_unread_count');
export const markActivityNotification = (id, read = true) => callSupabaseRpc('nmood_mark_activity_notification', { p_id: id, p_read: !!read });
export const markAllActivityNotificationsRead = () => callSupabaseRpc('nmood_mark_all_activity_notifications_read');
export const dismissActivityNotification = (id) => callSupabaseRpc('nmood_dismiss_activity_notification', { p_id: id });
export const setMyNotificationDismissed = (id, dismissed, options) => callSupabaseRpc('nmood_set_my_notification_dismissed', { p_id: id, p_dismissed: dismissed }, options);
export const getMyUnreadDirectMessageCount = () => callSupabaseRpc('nmood_my_unread_direct_message_count');

export async function getMyPrivateConversations() {
  if(ISOLATED_APP_BUILD)return isolatedAppAdapters().client.conversations({action:'list'});
  return callSupabaseRpc("nmood_list_private_conversations");
}

export async function recordProfileViewEvent(profileOwnerId) {
  if (!profileOwnerId) return { ok: true, recorded: false };
  return callSupabaseRpc("nmood_record_profile_view", { p_profile_owner: String(profileOwnerId) });
}

export const getNmoodJoinState = (postId) => callSupabaseRpc('nmood_main_post_join_state', { p_post_id: postId });
export const requestToJoinNmood = (postId) => callSupabaseRpc('nmood_request_to_join_main_post', { p_post_id: postId });
export const submitExperienceReview = (experienceId, rating, review = '') =>
  callSupabaseRpc('nmood_submit_experience_review', {
    p_experience_id: experienceId,
    p_rating: rating,
    p_review: review,
  });

export async function getDirectMessageAccess(palId) {
  if(ISOLATED_APP_BUILD)return (await isolatedAppAdapters().client.conversations({action:'peer',peer_id:palId})).direct_message_access;
  const access = await callSupabaseRpc('nmood_direct_message_access', { p_pal_id: palId });
  return access || { connected: false, blocked: false, can_message: false, reason: 'unavailable' };
}

export async function getPrivateChatPeer(palId) {
  if(ISOLATED_APP_BUILD)return isolatedAppAdapters().client.conversations({action:'peer',peer_id:palId});
  const userId = getSupabaseSession()?.user?.id;
  if (!userId || !palId || String(userId) === String(palId)) throw new Error('Private chat is unavailable.');
  if (REGION_ENABLED) return callSupabaseRpc('nmood_get_private_chat_peer', { p_pal_id: palId }, { expectedUserId: userId });
  const [access, profileResponse] = await Promise.all([
    getDirectMessageAccess(palId),
    callSupabaseRpc('nmood_get_member_profile', { p_member_id: palId }, { expectedUserId: userId }),
  ]);
  const profile = profileResponse?.blocked ? null : profileResponse?.profile;
  if (!access.can_message || !profile) {
    const error = new Error(access.reason === 'blocked'
      ? 'Messaging is unavailable because this member is blocked.'
      : 'This member accepts messages from connections only.');
    error.code = access.reason || 'unavailable';
    throw error;
  }
  return { ...profile, direct_message_access: access };
}

export async function getOrCreatePrivateConversation(palId) {
  if (ISOLATED_APP_BUILD) return isolatedAppAdapters().messages.getOrCreatePrivateConversation(palId);
  return callSupabaseRpc('nmood_get_private_conversation', { p_pal_id: palId });
}

export async function getPrivateMessages(conversationId) {
  if (ISOLATED_APP_BUILD) return isolatedAppAdapters().messages.getPrivateMessages(conversationId);
  if (!conversationId) return [];
  const path = `/rest/v1/private_messages?conversation_id=eq.${encodeURIComponent(conversationId)}&deleted_at=is.null&select=id,conversation_id,sender_id,body,message_type,payload,reply_to_id,edited_at,unsent_at,created_at,read_at&order=created_at.asc&limit=500`;
  let rows;
  try { rows = await request(path); }
  catch (error) {
    // Keep existing chat readable until the separately deployed edit migration.
    // Never fall back on authorization, connectivity, or arbitrary server errors.
    if (error?.code !== '42703') throw error;
    rows = await request(path.replace(',edited_at', '').replace(',unsent_at', ''));
  }
  let hidden = [];
  try { hidden = await request('/rest/v1/member_hidden_messages?select=message_id'); }
  catch (error) { if (!['42P01','PGRST205'].includes(error?.code)) throw error; }
  const hiddenIds = new Set((hidden || []).map(row => row.message_id));
  rows = (rows || []).filter(row => !hiddenIds.has(row.id));
  return Promise.all((rows || []).map(async (row) => {
    const payload = row.payload && typeof row.payload === 'object' ? { ...row.payload } : {};
    if (typeof payload.file_url === 'string' && payload.file_url.startsWith('private/')) {
      payload.file_path = payload.file_url;
      payload.file_url = await getSignedStorageUrl('chat-attachments', payload.file_path);
    }
    return { ...row, payload };
  }));
}

export async function sendPrivateMessage(palId, message = {}) {
  if (ISOLATED_APP_BUILD) return isolatedAppAdapters().messages.sendPrivateMessage(palId, message);
  const payload = { ...message };
  const localSafety = localSafetyDecision((typeof message.content === 'string' ? message.content : '') + ' ' + (message.file_name || ''));
  payload.client_safety = { decision: localSafety.decision, rule_version: localSafety.signals[0]?.ruleVersion || 'nmood-local-safety-2026-09-v1' };
  delete payload.type;
  delete payload.content;
  delete payload.reply_to_id;
  delete payload.reply_to_text;
  const result = await callSupabaseRpc('nmood_send_private_message', {
    p_pal_id: palId,
    p_message_type: message.type || 'text',
    p_body: typeof message.content === 'string' ? message.content : '',
    p_payload: payload,
    p_reply_to_id: message.reply_to_id || null,
  });
  if (result?.delivery_state === 'held') { const error = new Error('This message was not delivered. Nmood held it for a private safety review.'); error.code = 'NMOOD_SAFETY_HELD'; throw error; }
  return result;
}

export const markPrivateConversationRead = (conversationId) =>
  callSupabaseRpc('nmood_mark_private_conversation_read', { p_conversation_id: conversationId });
export const setPrivateConversationTyping = (conversationId, typing) =>
  callSupabaseRpc('nmood_set_private_typing', { p_conversation_id: conversationId, p_typing: !!typing });
export const editPrivateMessage = (messageId, content) =>
  ISOLATED_APP_BUILD ? isolatedAppAdapters().messages.editPrivateMessage(messageId, content) : callSupabaseRpc('nmood_edit_private_message', { p_message_id: messageId, p_content: content });
export const hidePrivateMessage = (messageId) => callSupabaseRpc('nmood_hide_private_message', {p_message_id:messageId});
export const hidePrivateConversation = (conversationId, throughAt) => callSupabaseRpc('nmood_hide_private_conversation', {p_conversation_id:conversationId,p_through_at:throughAt});

export const deletePrivateMessage = (messageId) =>
  ISOLATED_APP_BUILD ? isolatedAppAdapters().messages.deletePrivateMessage(messageId) : callSupabaseRpc('nmood_delete_private_message', { p_message_id: messageId });

const recordInvitationIds = new Set();
export const sendCircleInvitations = (circleId, recipientIds, message = '') =>
  callSupabaseRpc('nmood_send_record_invitations', { p_scope: 'circle', p_target_id: circleId, p_recipient_ids: recipientIds, p_message: message });
export const sendExperienceInvitations = (experienceId, recipientIds, message = '') =>
  callSupabaseRpc('nmood_send_record_invitations', { p_scope: 'experience', p_target_id: experienceId, p_recipient_ids: recipientIds, p_message: message });
export const respondCircleInvitation = (invitationId, status) =>
  callSupabaseRpc(recordInvitationIds.has(invitationId) ? 'nmood_respond_record_invitation' : 'nmood_respond_circle_invitation', { p_invitation_id: invitationId, p_status: status });
export const respondExperienceInvitation = (invitationId, status) =>
  callSupabaseRpc(recordInvitationIds.has(invitationId) ? 'nmood_respond_record_invitation' : 'nmood_respond_experience_invitation', { p_invitation_id: invitationId, p_status: status });
export const getMyInvitations = async (status = null) => {
  const [legacy, records] = await Promise.all([callSupabaseRpc('nmood_list_my_invitations', { p_status: status }), callSupabaseRpc('nmood_list_record_invitations', { p_status: status })]);
  for (const row of records || []) recordInvitationIds.add(row.id);
  return [...(legacy || []), ...(records || [])].sort((a,b)=>Date.parse(b.created_at)-Date.parse(a.created_at));
};


export async function uploadProfilePhoto(file, {expectedUserId, signal} = {}) {
  if (signal?.aborted || expectedUserId && getSupabaseSession()?.user?.id !== expectedUserId) throw new Error('Photo session changed.');
  if(ISOLATED_CUSTOMER_BUILD)return isolatedAppAdapters().media.upload(file);
  requireConfig();
  const session = getSupabaseSession();
  const userId = session?.user?.id;
  if (!session?.access_token || !userId) throw new Error('Please sign in before uploading a photo.');
  const extension = file.name?.split('.').pop()?.toLowerCase() || 'jpg';
  const path = userId + '/' + crypto.randomUUID() + '.' + extension;
  const response = await fetch(baseUrl + '/storage/v1/object/profile-photos/' + path, { method: 'POST', signal, headers: { apikey: publishableKey, Authorization: 'Bearer ' + session.access_token, 'Content-Type': file.type || 'image/jpeg', 'x-upsert': 'false' }, body: file });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.message || 'We could not upload that photo.');
  return baseUrl + '/storage/v1/object/public/profile-photos/' + path;
}


export function uploadMemberGalleryPhoto(file, { onProgress, expectedUserId, signal, cover = false } = {}) {
  if(ISOLATED_CUSTOMER_BUILD){const actor=getSupabaseSession()?.user?.id;if(!actor||expectedUserId&&expectedUserId!==actor||signal?.aborted)throw Error('Gallery session changed.');const adapters=isolatedAppAdapters();return adapters.media.upload(file).then(url=>{if(signal?.aborted||getSupabaseSession()?.user?.id!==actor)throw Error('Gallery session changed.');onProgress?.(100);return actor+'/'+(cover?'cover':'gallery')+'/'+adapters.media.idFor(url)+'.png';});}
  requireConfig();
  const session = getSupabaseSession();
  const userId = session?.user?.id;
  if (!session?.access_token || !userId) throw new Error('Please sign in before uploading a gallery photo.');
  const extension = file.name?.split('.').pop()?.toLowerCase() || 'jpg';
  if (expectedUserId && userId !== expectedUserId) throw new Error('Gallery session changed.');
  if (signal?.aborted) throw new Error('Upload cancelled.');
  const path = userId + (cover ? '/cover/' : '/gallery/') + crypto.randomUUID() + '.' + extension;
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', baseUrl + '/storage/v1/object/member-gallery/' + path);
    xhr.timeout = 60000;
    xhr.ontimeout = () => reject(Object.assign(new Error('Gallery upload timed out.'), { code: 'TIMEOUT' }));
    xhr.setRequestHeader('apikey', publishableKey);
    xhr.setRequestHeader('Authorization', 'Bearer ' + session.access_token);
    xhr.setRequestHeader('Content-Type', file.type || 'image/jpeg');
    xhr.setRequestHeader('x-upsert', 'false');
    if (xhr.upload && onProgress) xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) { onProgress?.(100); resolve(path); return; }
      let message = 'We could not upload that gallery photo.';
      try { message = JSON.parse(xhr.responseText)?.message || message; } catch { }
      reject(new Error(message + ' (' + xhr.status + ')'));
    };
    xhr.onerror = () => reject(new Error('Upload failed. Check your connection and try again.'));
    xhr.onabort = () => reject(new Error('Upload cancelled.'));
    const abort = () => xhr.abort();
    signal?.addEventListener('abort', abort, { once: true });
    xhr.addEventListener('loadend', () => signal?.removeEventListener('abort', abort), { once: true });
    xhr.send(file);
  });
}

export async function deleteMemberGalleryPhoto(path, { expectedUserId, signal, protectedPhoto } = {}) {
  if(ISOLATED_CUSTOMER_BUILD){const actor=getSupabaseSession()?.user?.id;if(!actor||expectedUserId&&actor!==expectedUserId||signal?.aborted)throw Error('Gallery session changed.');return isolatedAppAdapters().client.profile({action:'gallery.delete',path});}
  requireConfig();
  const session = await getRequestSession();
  const userId = session?.user?.id;
  if (!session?.access_token || !userId || (expectedUserId && userId !== expectedUserId) || getSupabaseSession()?.user?.id !== userId) throw new Error('Gallery session changed.');
  // Resolve only this project's existing authorized storage buckets. External
  // legacy images are not deletable through this API and must not report success.
  const resolve = (path) => {
    let bucket = 'member-gallery';
    if (typeof path === 'string' && path.startsWith('https://')) {
    const url = new URL(path);
    const match = url.pathname.match(/^\/storage\/v1\/object\/(?:public|sign)\/(member-gallery|profile-photos)\/(.+)$/);
    if (url.origin !== new URL(baseUrl).origin || !match) throw Object.assign(new Error('Unsupported gallery path'), {code:'GALLERY_PATH_UNSUPPORTED'});
    bucket = match[1]; path = decodeURIComponent(match[2]);
  }
    if (typeof path !== 'string' || !path.startsWith(userId + '/') || path.split('/').some(segment => !segment || segment === '.' || segment === '..') || /[?%#\\]/.test(path)) throw Object.assign(new Error('Unsupported gallery path'), {code:'GALLERY_PATH_UNSUPPORTED'});
    return { bucket, path };
  };
  const target = resolve(path);
  let primary;
  try { primary = resolve(protectedPhoto); } catch { /* Not a managed primary photo. */ }
  if (primary?.bucket === target.bucket && primary?.path === target.path) return { retainedPrimary: true };
  const { bucket } = target; path = target.path;
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) abort();
  signal?.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(abort, 8000);
  let response;
  try {
    response = await fetch(baseUrl + '/storage/v1/object/' + bucket + '/' + path.split('/').map(encodeURIComponent).join('/'), {
      method: 'DELETE', headers: { apikey: publishableKey, Authorization: 'Bearer ' + session.access_token }, signal: controller.signal,
    });
  } finally { clearTimeout(timer); signal?.removeEventListener('abort', abort); }
  if (!response.ok && response.status !== 404) throw new Error('Gallery deletion failed. Please retry.');
}

export async function deleteProfilePhoto(url) {
  requireConfig();
  const session = await getRequestSession();
  if (!session?.access_token || !url) return;
  const prefix = baseUrl + '/storage/v1/object/public/profile-photos/';
  if (!url.startsWith(prefix)) return;
  const path = url.slice(prefix.length);
  const response = await fetch(baseUrl + '/storage/v1/object/profile-photos/' + path, {
    method: 'DELETE', headers: { apikey: publishableKey, Authorization: 'Bearer ' + session.access_token },
  });
  if (!response.ok && response.status !== 404) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message || 'Could not remove the stored profile photo.');
  }
  return true;
}

export async function uploadPrivateChatAttachment(conversationId, file) {
  requireConfig();
  const session = await getRequestSession();
  const userId = session?.user?.id;
  if (!session?.access_token || !userId) throw new Error('Please sign in before uploading an attachment.');
  if (!conversationId) throw new Error('Open a conversation before adding an attachment.');
  const extension = file.name?.split('.').pop()?.toLowerCase() || 'bin';
  const path = 'private/' + conversationId + '/' + userId + '/' + crypto.randomUUID() + '.' + extension;
  const response = await fetch(baseUrl + '/storage/v1/object/chat-attachments/' + path, {
    method: 'POST',
    headers: { apikey: publishableKey, Authorization: 'Bearer ' + session.access_token, 'Content-Type': file.type || 'application/octet-stream', 'x-upsert': 'false' },
    body: file,
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.message || 'We could not upload that attachment.');
  return path;
}

export async function deletePrivateChatAttachment(path) {
  if (!path?.startsWith('private/')) return;
  requireConfig();
  const session = await getRequestSession();
  if (!session?.access_token) return;
  await fetch(baseUrl + '/storage/v1/object/chat-attachments/' + path, {
    method: 'DELETE',
    headers: { apikey: publishableKey, Authorization: 'Bearer ' + session.access_token },
  }).catch(() => {});
}

export async function uploadGroupChatAttachment(scope, containerId, file) {
  requireConfig();
  if (!['circle', 'experience'].includes(scope)) throw new Error('Unsupported group chat.');
  if (!containerId) throw new Error('Open a group chat before adding an attachment.');
  const session = await getRequestSession();
  const userId = session?.user?.id;
  if (!session?.access_token || !userId) throw new Error('Please sign in before uploading an attachment.');
  const extension = file.name?.split('.').pop()?.toLowerCase() || 'bin';
  const path = scope + '/' + containerId + '/' + userId + '/' + crypto.randomUUID() + '.' + extension;
  const response = await fetch(baseUrl + '/storage/v1/object/chat-attachments/' + path, {
    method: 'POST',
    headers: { apikey: publishableKey, Authorization: 'Bearer ' + session.access_token, 'Content-Type': file.type || 'application/octet-stream', 'x-upsert': 'false' },
    body: file,
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.message || 'We could not upload that attachment.');
  return path;
}

export async function deleteGroupChatAttachment(path) {
  if (!/^(circle|experience)\//.test(path || '')) return;
  requireConfig();
  const session = await getRequestSession();
  if (!session?.access_token) return;
  await fetch(baseUrl + '/storage/v1/object/chat-attachments/' + path, {
    method: 'DELETE',
    headers: { apikey: publishableKey, Authorization: 'Bearer ' + session.access_token },
  }).catch(() => {});
}

// PRIVATE bucket, separate from public profile photos. Only the uploading
// member and platform admins can read these objects (see migration 0016);
// callers must never assume the returned path is a public URL — it is a
// storage path, and viewing it requires getSignedStorageUrl() below.
export async function uploadVerificationSelfie(file) {
  requireConfig();
  const session = getSupabaseSession();
  const userId = session?.user?.id;
  if (!session?.access_token || !userId) throw new Error('Please sign in before uploading a photo.');
  const extension = file.name?.split('.').pop()?.toLowerCase() || 'jpg';
  const path = userId + '/' + crypto.randomUUID() + '.' + extension;
  const response = await fetch(baseUrl + '/storage/v1/object/verification-selfies/' + path, { method: 'POST', headers: { apikey: publishableKey, Authorization: 'Bearer ' + session.access_token, 'Content-Type': file.type || 'image/jpeg', 'x-upsert': 'false' }, body: file });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.message || 'We could not upload that photo.');
  return path;
}

// Short-lived signed URL for a private storage object. RLS on the bucket
// still applies to the signing request itself, so a non-owner/non-admin
// caller gets a 403 here rather than a usable URL.
export async function getSignedStorageUrl(bucket, path, expiresInSeconds = 300) {
  if(ISOLATED_CUSTOMER_BUILD){const match=typeof path==='string'&&path.match(/^([0-9a-f-]{36})\/(?:gallery|cover)\/([0-9a-f-]{36})\.png$/);if(bucket!=='member-gallery'||!match)throw Error('Unsupported isolated media path.');return isolatedAppAdapters().media.display(match[2]);}
  requireConfig();
  const session = getSupabaseSession();
  if (!session?.access_token || !path) return null;
  const response = await fetch(baseUrl + '/storage/v1/object/sign/' + bucket + '/' + path, {
    method: 'POST',
    headers: { apikey: publishableKey, Authorization: 'Bearer ' + session.access_token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ expiresIn: expiresInSeconds }),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.signedURL) return null;
  return baseUrl + '/storage/v1' + body.signedURL;
}

// Same approved `profile-photos` bucket and per-user folder as uploadProfilePhoto
// (storage policy requires foldername[1] === auth.uid()), but reports real byte
// progress, which fetch() cannot do.
export function uploadImageToStorage(file, { folder = 'covers', onProgress } = {}) {
  if(ISOLATED_APP_BUILD)return isolatedAppAdapters().media.upload(file);
  requireConfig();
  const session = getSupabaseSession();
  const userId = session?.user?.id;
  if (!session?.access_token || !userId) throw new Error('Please sign in before uploading a photo.');
  const extension = file.name?.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${userId}/${folder}/${crypto.randomUUID()}.${extension}`;
  const publicUrl = baseUrl + '/storage/v1/object/public/profile-photos/' + path;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', baseUrl + '/storage/v1/object/profile-photos/' + path);
    xhr.setRequestHeader('apikey', publishableKey);
    xhr.setRequestHeader('Authorization', 'Bearer ' + session.access_token);
    xhr.setRequestHeader('Content-Type', file.type || 'image/jpeg');
    xhr.setRequestHeader('x-upsert', 'false');
    if (onProgress && xhr.upload) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
      };
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve(publicUrl);
        return;
      }
      let message = 'We could not upload that photo.';
      try { message = JSON.parse(xhr.responseText)?.message || message; } catch { /* keep default */ }
      reject(new Error(`${message} (${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error('Upload failed. Check your connection and try again.'));
    xhr.onabort = () => reject(new Error('Upload cancelled.'));
    xhr.send(file);
  });
}

// Returns only image bytes. The caller owns any temporary object URL.
export async function getPublicPlaceMapPreview(postId,{signal}={}){
 requireConfig();
 const session=await getRequestSession();const path='/functions/v1/nmood-public-place-map-preview';
 const ticket=beginDestinationRequest(path,session?.user?.id);
 const response=await fetch(baseUrl+path,{method:'POST',signal,headers:{apikey:publishableKey,Authorization:'Bearer '+session?.access_token,'Content-Type':'application/json',...(ticket?{'X-Nmood-Destination-Revision':String(ticket.ticket.revision)}:{})},body:JSON.stringify({post_id:postId})});
 if(!response.ok||!/^image\/(png|jpeg|webp)(;|$)/i.test(response.headers.get('content-type')||''))throw new Error('Map preview unavailable.');
 const blob=await response.blob();
 if(getSupabaseSession()?.user?.id!==session?.user?.id)throw new Error('Session changed.');
 acceptDestinationImage(ticket,getSupabaseSession()?.user?.id,response);return blob;
}
