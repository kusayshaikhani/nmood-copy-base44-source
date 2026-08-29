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
  return request(`?entity_type=eq.${encodeURIComponent(entityType)}&select=*`);
}

export async function createOwnedRecord(entityType, data) {
  const session = getSupabaseSession();
  const [record] = await request('', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ entity_type: entityType, owner_id: session.user?.id, data }),
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
