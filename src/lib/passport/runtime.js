import { acquireScopeRecovery } from './scope-recovery';
import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { callSupabaseRpc } from '@/api/supabaseClient';
import { MAIN_PASSPORT } from './enabled';
export { MAIN_PASSPORT } from './enabled';
export function usePassportScope() {
  const { user, member } = useAuth();
  const client = useQueryClient();
  const query = useQuery({ queryKey: ['passportScope', user?.id, member?.country_code, member?.country],
    queryFn: ({ signal }) => callSupabaseRpc('nmood_get_explorer_scope', {}, { signal, expectedUserId: user?.id }),
    enabled: MAIN_PASSPORT && !!user?.id, staleTime: 0, retry: false, refetchInterval: 30000, refetchOnWindowFocus: true });
  useEffect(() => {
    if (!MAIN_PASSPORT || !user?.id) return;
    return acquireScopeRecovery(client, user.id);
  }, [client, user?.id]);
  useEffect(() => {
    if (!MAIN_PASSPORT) return;
    const refresh = () => { void client.resetQueries({ queryKey: ['passportScope'] }); };
    const expiry = Date.parse(query.data?.premium_expires_at);
    const timer = Number.isFinite(expiry) && expiry > Date.now() ? setTimeout(refresh, Math.min(2147483647, expiry - Date.now() + 1)) : null;
    return () => { clearTimeout(timer); };
  }, [client, user?.id, query.data?.premium_expires_at]);
  useEffect(() => {
    if (!MAIN_PASSPORT) return;
    const fingerprint = query.isError ? null : query.data?.fingerprint;
    // Home keeps its own card queue.  It must be dropped with the wider
    // discovery cache when Passport changes, otherwise a WebView can retain
    // a previous country\'s empty (or stale) deck until the next navigation.
    const stale = q => ['discovery','nmoodPosts','home-dating-deck'].includes(q.queryKey[0]) && q.queryKey.at(-1) !== fingerprint;
    void client.cancelQueries({ predicate: stale });
    client.removeQueries({ predicate: stale });
  }, [client, query.data?.fingerprint, query.isError]);
  return { ...query, data: query.isError ? null : query.data };
}
export async function savePassportPreference(changes, client, actor) {
  const result = await callSupabaseRpc('nmood_save_explorer_passport', { p_changes: changes }, { expectedUserId: actor });
  await client.cancelQueries({ predicate: q => ['passportScope', 'discovery', 'nmoodPosts', 'home-dating-deck'].includes(q.queryKey[0]) });
  client.removeQueries({ predicate: q => ['discovery', 'nmoodPosts', 'home-dating-deck'].includes(q.queryKey[0]) });
  await client.resetQueries({ queryKey: ['passportScope'] });
  return result;
}
