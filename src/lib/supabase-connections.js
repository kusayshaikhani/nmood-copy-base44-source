import {ISOLATED_CUSTOMER_BUILD} from './isolated-customer/runtime.mjs';
import {isolatedAppAdapters} from './isolated-app/active.mjs';
import { beginDestinationRequest, acceptDestinationRequest } from '@/lib/destination-session';
import { destinationRequest } from '@/lib/destination-transport';
import { passportRuntime } from './passport-runtime';
import { beginPassportRequest, finishPassportRequest } from './passport-adapters';
import { REGION_ENABLED } from './region-config';
import { callSupabaseRpc, getSupabaseSession } from '@/api/supabaseClient';
import { supabaseConfig } from '@/config/supabase-config';

const { baseUrl, publishableKey } = supabaseConfig;

function headers() {
  const session = getSupabaseSession();
  if (!baseUrl || !publishableKey || !session?.access_token) throw new Error('Please sign in to continue.');
  return { apikey: publishableKey, Authorization: `Bearer ${session.access_token}` };
}

async function get(path) {
  const destination=beginDestinationRequest('/rest/v1/'+path,getSupabaseSession()?.user?.id);
  const ticket=destination?null:beginPassportRequest(passportRuntime,'/rest/v1/'+path,getSupabaseSession()?.user?.id);
  const transport=destinationRequest('/rest/v1/'+path,{},destination);
  const response = await fetch(`${baseUrl}${transport.path}`, { ...transport.options, headers: {...headers(),'Content-Type':'application/json',...(destination?{'X-Nmood-Destination-Revision':String(destination.ticket.revision)}:{})} });
  if (!response.ok) throw new Error('Could not load connections.');
  const body=await response.json();
  finishPassportRequest(passportRuntime,ticket,getSupabaseSession()?.user?.id);
  acceptDestinationRequest(destination,getSupabaseSession()?.user?.id,body);
  return destination ? body.data : body;
}

async function profiles(ids, expectedUserId) {
  if (!ids.length) return new Map();
  // The ordinary members-table read is correctly protected by RLS. Use the
  // same server-authorized projection that successfully powers /pal/:id.
  // An empty direct-table response must never be shown as “Deleted account”.
  const rows = (await Promise.all(ids.map(async id => {
    const response = await callSupabaseRpc('nmood_get_member_profile', { p_member_id: id }, { expectedUserId });
    return response?.blocked || !response?.profile ? null : response.profile;
  }))).filter(Boolean);
  return new Map(rows.map((profile) => [profile.id, profile]));
}

export async function loadSupabaseConnections(userId) {
  if(ISOLATED_CUSTOMER_BUILD){const client=isolatedAppAdapters().client;if(client.actorId!==userId)throw Error('ISOLATED_SESSION_REQUIRED');return client.social({action:'list'});}
  const [incoming, outgoing, connections] = await Promise.all([
    get(`pal_requests?receiver_id=eq.${encodeURIComponent(userId)}&order=created_at.desc`),
    get(`pal_requests?sender_id=eq.${encodeURIComponent(userId)}&order=created_at.desc`),
    get(`pal_connections?member_id=eq.${encodeURIComponent(userId)}&order=last_activity_at.desc`),
  ]);
  const ids = [...new Set([...incoming.map((r) => r.sender_id), ...outgoing.map((r) => r.receiver_id), ...connections.map((c) => c.pal_id)])];
  const memberById = await profiles(ids, userId);
  const withSender = incoming.map((r) => ({ ...r, sender_user_id: r.sender_id, sender_name: memberById.get(r.sender_id)?.display_name || (REGION_ENABLED ? 'Member unavailable' : 'Deleted account'), sender_avatar: memberById.get(r.sender_id)?.photo_url || null, mutual_interests: memberById.get(r.sender_id)?.interests || [], created_date: r.created_at }));
  const withReceiver = outgoing.map((r) => ({ ...r, receiver_user_id: r.receiver_id, receiver_name: memberById.get(r.receiver_id)?.display_name || (REGION_ENABLED ? 'Member unavailable' : 'Deleted account'), receiver_avatar: memberById.get(r.receiver_id)?.photo_url || null, mutual_interests: memberById.get(r.receiver_id)?.interests || [], created_date: r.created_at }));
  const withPals = connections.map((c) => ({ ...c, pal_user_id: c.pal_id, pal_name: memberById.get(c.pal_id)?.display_name || (REGION_ENABLED ? 'Member unavailable' : 'Deleted account'), pal_avatar: memberById.get(c.pal_id)?.photo_url || null, pal_city: memberById.get(c.pal_id)?.city || '', mutual_interests: memberById.get(c.pal_id)?.interests || [], connected_date: c.connected_at, updated_date: c.last_activity_at, is_active: true }));
  return { incoming: withSender, outgoing: withReceiver, connections: withPals };
}

export async function sendSupabasePalRequest(receiverId, message) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new Error('You appear to be offline. Reconnect and try again.');
  try {
    return await callSupabaseRpc('send_pal_request', { p_receiver_id: receiverId, p_message: message || '' });
  } catch (error) {
    const text = String(error?.message || '');
    if (/already pending|already connected|limit reached.*try again after|unavailable|not available|sign in/i.test(text)) throw new Error(text);
    throw new Error('Could not send this connection request. Please try again. (NMG-CONNECTION-SEND)');
  }
}

export async function respondSupabasePalRequest(requestId, accept) {
  try {
    const request = await callSupabaseRpc('respond_to_pal_request', { p_request_id: requestId, p_accept: accept });
    return request;
  } catch (error) {
    const message = String(error?.message || '');
    const action = accept ? 'accepted' : 'declined';
    if (/blocked/i.test(message)) throw new Error(`This request cannot be ${action} because one of you has blocked the other.`);
    if (/already been handled|no longer pending|not found/i.test(message)) throw new Error('This request is no longer pending. Refresh the profile.');
    throw new Error(`Could not ${accept ? 'accept' : 'decline'} this connection request. Please try again. (NMG-CONNECTION-${accept ? 'ACCEPT' : 'DECLINE'})`);
  }
}

export async function cancelSupabasePalRequest(requestId) {
  try { return await callSupabaseRpc('cancel_my_pal_request', { p_request_id: requestId }); }
  catch (error) {
    const message = String(error?.message || '');
    if (/no longer pending|not found|blocked|unavailable/i.test(message)) throw new Error(message);
    throw new Error('Could not cancel this connection request. Please try again. (NMG-CONNECTION-CANCEL)');
  }
}
export const removeSupabasePalConnection = (palId) => callSupabaseRpc('remove_my_pal_connection', { p_pal_id: palId });
