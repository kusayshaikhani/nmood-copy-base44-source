import { getSupabaseSession } from '@/api/supabaseClient';

const DEFAULT_SUPABASE_URL = 'https://nhyrhvwhsxbtidigpeel.supabase.co';
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_4VD3jwwZIvkDiIkQ9F1Oqw_0tiodG5R';

const baseUrl = (import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL)?.replace(/\/$/, '');
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || DEFAULT_SUPABASE_PUBLISHABLE_KEY;

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
  const response = await fetch(`${baseUrl}/rest/v1/app_records${path}`, {
    ...options,
    headers: headers(options.headers),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.message || 'Could not access saved data.');
  return body;
}

export async function listOwnedRecords(entityType) {
  const session = getSupabaseSession();
  const userId = session?.user?.id;
  if (!userId) throw new Error('Please sign in to continue.');
  return request(`?entity_type=eq.${encodeURIComponent(entityType)}&owner_id=eq.${encodeURIComponent(userId)}&order=created_at.desc&select=*`);
}

export async function createOwnedRecord(entityType, data) {
  const session = getSupabaseSession();
  const userId = session?.user?.id;
  if (!userId) throw new Error('Please sign in to continue.');
  const [record] = await request('', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ entity_type: entityType, owner_id: userId, data }),
  });
  return record;
}

export async function updateOwnedRecord(id, data) {
  const [record] = await request(`?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ data, updated_at: new Date().toISOString() }),
  });
  return record;
}

export async function deleteOwnedRecord(id) {
  await request(`?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' });
}


// Every record the caller is allowed to read (RLS decides), newest first.
export async function listReadableRecords(entityType, { limit = 100 } = {}) {
  return request(`?entity_type=eq.${encodeURIComponent(entityType)}&order=created_at.desc&limit=${Number(limit)}&select=*`);
}

export async function getReadableRecord(entityType, id) {
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
