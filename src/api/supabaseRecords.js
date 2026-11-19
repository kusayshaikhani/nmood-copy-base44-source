import {ISOLATED_APP_BUILD, isolatedAppAdapters} from '@/lib/isolated-app/active.mjs';
import { beginDestinationRequest, acceptDestinationRequest } from '@/lib/destination-session';
import { destinationRequest } from '@/lib/destination-transport';
import { passportRuntime } from '@/lib/passport-runtime';
import { beginPassportRequest, finishPassportRequest } from '@/lib/passport-adapters';
import { callSupabaseRpc, getSupabaseSession } from '@/api/supabaseClient';
import { supabaseConfig } from '@/config/supabase-config';

const { baseUrl, publishableKey } = supabaseConfig;

function headers(extra = {}) {
  const session = getSupabaseSession();
  if (!baseUrl || !publishableKey || !session?.access_token) {
    throw new Error('Please sign in to continue.');
  }
  return {
    apikey: publishableKey,
    Authorization: `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

async function request(path, options = {}) {
  const destination = beginDestinationRequest('/rest/v1/app_records'+path,getSupabaseSession()?.user?.id);
  const ticket = destination ? null : beginPassportRequest(passportRuntime, '/rest/v1/app_records'+path, getSupabaseSession()?.user?.id);
  const transport = destinationRequest('/rest/v1/app_records'+path,options,destination);
  const response = await fetch(`${baseUrl}${transport.path}`, {
    ...transport.options,
    headers: headers({...options.headers,...(destination ? {'X-Nmood-Destination-Revision':String(destination.ticket.revision)} : {})}),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.message || 'Could not access saved data.');
  finishPassportRequest(passportRuntime, ticket, getSupabaseSession()?.user?.id);
  acceptDestinationRequest(destination,getSupabaseSession()?.user?.id,body);
  return destination ? body.data : body;
}

export async function listOwnedRecords(entityType) {
  if (ISOLATED_APP_BUILD) return isolatedAppAdapters().records.listOwnedRecords(entityType);
  const session = getSupabaseSession();
  const userId = session?.user?.id;
  if (!userId) throw new Error('Please sign in to continue.');
  return request(`?entity_type=eq.${encodeURIComponent(entityType)}&owner_id=eq.${encodeURIComponent(userId)}&order=created_at.desc&select=*`);
}

export async function createOwnedRecord(entityType, data) {
  if (ISOLATED_APP_BUILD) return isolatedAppAdapters().records.createOwnedRecord(entityType, data);
  if (entityType === 'PhotoVerification') {
    return callSupabaseRpc('nmood_submit_photo_verification', { p_data: data });
  }
  const result = entityType === 'Experience' && data?.circle_id
    ? await callSupabaseRpc('nmood_create_circle_experience', { p_circle_id: data.circle_id, p_data: data })
    : await callSupabaseRpc('nmood_create_premium_content', { p_entity_type: entityType, p_data: data });
  window.dispatchEvent(new Event('nmood:feed-changed'));
  return result;
}

export async function updateOwnedRecord(id, data) {
  if (ISOLATED_APP_BUILD) return isolatedAppAdapters().records.updateOwnedRecord(id, data);
  const [record] = await request(`?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ data, updated_at: new Date().toISOString() }),
  });
  window.dispatchEvent(new Event('nmood:feed-changed'));
  return record;
}

export async function deleteOwnedRecord(id) {
  if (ISOLATED_APP_BUILD) return isolatedAppAdapters().records.deleteOwnedRecord(id);
  await request(`?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' });
  window.dispatchEvent(new Event('nmood:feed-changed'));
}


// Every record the caller is allowed to read (RLS decides), newest first.
export async function listReadableRecords(entityType, { limit = 100, signal } = {}) {
  if (ISOLATED_APP_BUILD) return isolatedAppAdapters().records.listReadableRecords(entityType, {limit, signal});
  return request(`?entity_type=eq.${encodeURIComponent(entityType)}&order=created_at.desc&limit=${Number(limit)}&select=*`, { signal });
}

export async function getReadableRecord(entityType, id) {
  if (ISOLATED_APP_BUILD) return isolatedAppAdapters().records.getReadableRecord(entityType, id);
  if (!id) return null;
  const rows = await request(`?entity_type=eq.${encodeURIComponent(entityType)}&id=eq.${encodeURIComponent(id)}&select=*`);
  return Array.isArray(rows) ? rows[0] || null : null;
}


// app_records stores the entity body in `data`; the rest of the app expects a
// flat object with a top-level id and created_date.
export function toEntity(row) {
  if (!row?.id) return null;
  return {
    ...(row.data || {}),
    id: row.id,
    owner_id: row.owner_id,
    created_date: row.created_at,
    updated_date: row.updated_at,
  };
}
