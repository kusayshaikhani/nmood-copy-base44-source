import { callSupabaseRpc, getSupabaseSession } from '@/api/supabaseClient';
const requests = new WeakMap();
export function scopeChanged() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('nmood:explorer-scope-stale'));
  return Object.assign(new Error('Explorer scope changed. Refresh discovery.'), { code: 'EXPLORER_SCOPE_CHANGED' });
}
export function matchesScope(a, b) {
  return !!a?.fingerprint && a.fingerprint === b?.fingerprint &&
    ['actor','premium','passport_enabled','active','passport_country','passport_city','country','city'].every(key => a[key] === b[key]);
}
export function bindRequestScope(signal, scope) { if (signal) requests.set(signal, scope); }
export async function verifyCurrentScope(expected, signal) {
  if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
  if (!expected?.fingerprint || getSupabaseSession()?.user?.id !== expected.actor) throw scopeChanged();
  const current = await callSupabaseRpc('nmood_get_explorer_scope', {}, { signal, expectedUserId: expected.actor });
  if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
  if (getSupabaseSession()?.user?.id !== expected.actor || !matchesScope(expected, current)) throw scopeChanged();
  return current;
}
export async function readExplorerRows(kind, args, signal, expected) {
  expected ||= requests.get(signal) || await callSupabaseRpc('nmood_get_explorer_scope', {}, { signal });
  if (!expected?.fingerprint || getSupabaseSession()?.user?.id !== expected.actor) throw scopeChanged();
  const response = await callSupabaseRpc('nmood_explorer_response', {
    p_kind: kind, p_args: args, p_expected_fingerprint: expected.fingerprint,
  }, { signal, expectedUserId: expected.actor }).catch(error => {
    if (String(error?.message).includes('EXPLORER_SCOPE_CHANGED')) throw scopeChanged();
    throw error;
  });
  if (!matchesScope(expected, response?.scope) || !Array.isArray(response?.rows)) throw scopeChanged();
  await verifyCurrentScope(expected, signal);
  return response.rows;
}
