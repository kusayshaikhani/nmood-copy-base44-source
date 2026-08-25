// Supabase browser client for Nmood. Service-role keys must never be used here.
const baseUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '');
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const sessionKey = 'nmood.supabase.session';

function requireConfig() {
  if (!baseUrl || !publishableKey) throw new Error('Nmood is not connected to Supabase yet.');
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

export function restoreSupabaseSessionFromUrl() {
  if (typeof window === 'undefined' || !window.location.hash) return null;
  const values = new URLSearchParams(window.location.hash.slice(1));
  const access_token = values.get('access_token');
  if (!access_token) return null;
  const session = { access_token, refresh_token: values.get('refresh_token'), token_type: values.get('token_type') || 'bearer', expires_in: Number(values.get('expires_in') || 0) };
  setSupabaseSession(session);
  window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
  return session;
}

async function request(path, options = {}) {
  requireConfig();
  const session = getSupabaseSession();
  const response = await fetch(baseUrl + path, { ...options, headers: { apikey: publishableKey, Authorization: 'Bearer ' + (session?.access_token || publishableKey), 'Content-Type': 'application/json', ...(options.headers || {}) } });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.message || body?.error_description || body?.msg || 'Supabase request failed.');
  return body;
}

export const supabaseAuth = {
  async signInWithPassword(email, password) {
    const session = await request('/auth/v1/token?grant_type=password', { method: 'POST', body: JSON.stringify({ email, password }) });
    setSupabaseSession(session);
    return session;
  },
  async signUp(email, password, data = {}) {
    const result = await request('/auth/v1/signup', { method: 'POST', body: JSON.stringify({ email, password, data, options: { emailRedirectTo: window.location.origin + '/auth' } }) });
    if (result?.access_token) setSupabaseSession(result);
    return result;
  },
  async resetPasswordForEmail(email) {
    const redirectTo = encodeURIComponent(window.location.origin + '/reset-password');
    return request('/auth/v1/recover?redirect_to=' + redirectTo, { method: 'POST', body: JSON.stringify({ email }) });
  },
  async updatePassword(password) {
    return request('/auth/v1/user', { method: 'PUT', body: JSON.stringify({ password }) });
  },
  async signInWithOAuth(provider) {
    requireConfig();
    const url = new URL(baseUrl + '/auth/v1/authorize');
    url.searchParams.set('provider', provider);
    url.searchParams.set('redirect_to', window.location.origin + '/auth');
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
