import { callSupabaseRpc, getSupabaseSession } from '@/api/supabaseClient';

const DEFAULT_SUPABASE_URL = 'https://nhyrhvwhsxbtidigpeel.supabase.co';
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_4VD3jwwZIvkDiIkQ9F1Oqw_0tiodG5R';

const baseUrl = (import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL)?.replace(/\/$/, '');
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || DEFAULT_SUPABASE_PUBLISHABLE_KEY;

function headers() {
  const session = getSupabaseSession();
  if (!baseUrl || !publishableKey || !session?.access_token) throw new Error('Please sign in to continue.');
  return { apikey: publishableKey, Authorization: `Bearer ${session.access_token}` };
}

async function get(path) {
  const response = await fetch(`${baseUrl}/rest/v1/${path}`, { headers: headers() });
  if (!response.ok) throw new Error('Could not load connections.');
  return response.json();
}

async function profiles(ids) {
  if (!ids.length) return new Map();
  const rows = await get(`members?id=in.(${ids.map(encodeURIComponent).join(',')})&select=id,display_name,photo_url,city,interests`);
  return new Map(rows.map((profile) => [profile.id, profile]));
}

async function requestEmailNotification(event, request) {
  const session = getSupabaseSession();
  if (!baseUrl || !publishableKey || !session?.access_token || !request?.id) return;
  try {
    await fetch(`${baseUrl}/functions/v1/pal-notifications`, {
      method: 'POST',
      headers: { ...headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, request_id: request.id }),
    });
  } catch {
    // Email delivery is best-effort and must never block a successful Pal action.
  }
}

export async function loadSupabaseConnections(userId) {
  const [incoming, outgoing, connections] = await Promise.all([
    get(`pal_requests?receiver_id=eq.${encodeURIComponent(userId)}&order=created_at.desc`),
    get(`pal_requests?sender_id=eq.${encodeURIComponent(userId)}&order=created_at.desc`),
    get(`pal_connections?member_id=eq.${encodeURIComponent(userId)}&order=last_activity_at.desc`),
  ]);
  const ids = [...new Set([...incoming.map((r) => r.sender_id), ...outgoing.map((r) => r.receiver_id), ...connections.map((c) => c.pal_id)])];
  const memberById = await profiles(ids);
  const withSender = incoming.map((r) => ({ ...r, sender_user_id: r.sender_id, sender_name: memberById.get(r.sender_id)?.display_name || 'Member', sender_avatar: memberById.get(r.sender_id)?.photo_url || null, mutual_interests: memberById.get(r.sender_id)?.interests || [], created_date: r.created_at }));
  const withReceiver = outgoing.map((r) => ({ ...r, receiver_user_id: r.receiver_id, receiver_name: memberById.get(r.receiver_id)?.display_name || 'Member', receiver_avatar: memberById.get(r.receiver_id)?.photo_url || null, mutual_interests: memberById.get(r.receiver_id)?.interests || [], created_date: r.created_at }));
  const withPals = connections.map((c) => ({ ...c, pal_user_id: c.pal_id, pal_name: memberById.get(c.pal_id)?.display_name || 'Member', pal_avatar: memberById.get(c.pal_id)?.photo_url || null, pal_city: memberById.get(c.pal_id)?.city || '', mutual_interests: memberById.get(c.pal_id)?.interests || [], connected_date: c.connected_at, updated_date: c.last_activity_at, is_active: true }));
  return { incoming: withSender, outgoing: withReceiver, connections: withPals };
}

export async function sendSupabasePalRequest(receiverId, message) {
  const request = await callSupabaseRpc('send_pal_request', { p_receiver_id: receiverId, p_message: message || '' });
  void requestEmailNotification('pal_request_created', request);
  return request;
}

export async function respondSupabasePalRequest(requestId, accept) {
  const request = await callSupabaseRpc('respond_to_pal_request', { p_request_id: requestId, p_accept: accept });
  if (accept) void requestEmailNotification('pal_request_accepted', request);
  return request;
}

export const cancelSupabasePalRequest = (requestId) => callSupabaseRpc('cancel_my_pal_request', { p_request_id: requestId });
export const removeSupabasePalConnection = (palId) => callSupabaseRpc('remove_my_pal_connection', { p_pal_id: palId });
