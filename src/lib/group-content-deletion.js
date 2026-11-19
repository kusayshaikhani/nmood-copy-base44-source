import { invokeSupabaseFunction } from '@/api/supabaseClient';

const OFFLINE = 'You appear to be offline. Reconnect and try again.';

export async function deleteOwnedGroupContent(scope, id) {
  if (!['circle', 'experience'].includes(scope) || !id) throw new Error('This content is not available.');
  if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new Error(OFFLINE);
  try {
    const result = await invokeSupabaseFunction('delete-owned-group', { scope, container_id: String(id) });
    if (!result?.ok || !['cancelled', 'deleted', 'already_deleted'].includes(result.status)) throw new Error('invalid_response');
    return result;
  } catch (error) {
    if (error?.message === OFFLINE) throw error;
    if (error?.error === 'owner_required') throw new Error(scope === 'circle'
      ? 'Only the Circle owner can delete this Circle.'
      : 'Only the Experience host can delete this Experience.');
    if (/only the .* (owner|host)/i.test(error?.message || '')) throw new Error(scope === 'circle'
      ? 'Only the Circle owner can delete this Circle.'
      : 'Only the Experience host can delete this Experience.');
    if (error?.status === 401) throw new Error('Your session has expired. Sign in again and retry.');
    if (error?.status === 404 || error?.error === 'function_not_deployed') throw new Error(`Deletion is not installed in this TestFlight environment. (NMG-${scope.toUpperCase()}-DELETE-RPC)`);
    if (error?.error === 'storage_cleanup_failed') throw new Error(`The private media cleanup could not be completed. Please retry. (NMG-${scope.toUpperCase()}-DELETE-STORAGE)`);
    if (error?.error === 'database_cleanup_failed') {
      const diagnostic = /^NMG-GROUP-RPC-[A-Z0-9]+$/.test(error?.diagnostic || '')
        ? error.diagnostic
        : `NMG-${scope.toUpperCase()}-DELETE-DATABASE`;
      throw new Error(`The ${scope} could not be removed after media cleanup. Please retry. (${diagnostic})`);
    }
    throw new Error(`Could not delete this ${scope}. Please try again. (NMG-${scope.toUpperCase()}-DELETE)`);
  }
}

export const deleteOwnedCircle = (id) => deleteOwnedGroupContent('circle', id);
export const deleteOwnedExperience = (id) => deleteOwnedGroupContent('experience', id);
