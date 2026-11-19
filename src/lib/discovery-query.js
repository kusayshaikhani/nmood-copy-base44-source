import { newestFirst } from '@/lib/passport/newest-first';
import { useRef } from 'react';
import { bindRequestScope, matchesScope, scopeChanged, verifyCurrentScope } from '@/lib/passport/response';
import { MAIN_PASSPORT, usePassportScope } from '@/lib/passport/runtime';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { useFeedRefresh, rotateFeed } from '@/lib/feed-refresh';
import { withTimeout } from '@/lib/bounded-operation';
import { queryClientInstance } from '@/lib/query-client';

export function invalidateDiscovery(kind) {
  return queryClientInstance.invalidateQueries({ queryKey: ['discovery', kind] });
}

// Errors remain errors. Successful data is shared across Home and Discover,
// scoped to the authenticated viewer, and refreshed by both activity and pull.
export function useDiscoveryQuery(kind, fetchRows, { enabled = true } = {}) {
  const { user } = useAuth();
  const client = useQueryClient();
  const scope = usePassportScope();
  const currentScope = useRef(scope.data); currentScope.current = scope.data;
  useFeedRefresh(!!user?.id && enabled);
  const query = useQuery({
    queryKey: ['discovery', kind, user?.id, ...(MAIN_PASSPORT ? [scope.data?.country || null, scope.data?.city || null, scope.data?.fingerprint || null] : [])],
    queryFn: async ({ signal }) => {
      const rows = await withTimeout(timeoutSignal => {
        const controller = new AbortController();
        const abort = () => controller.abort();
        signal.addEventListener('abort', abort, { once: true });
        timeoutSignal.addEventListener('abort', abort, { once: true });
        if (MAIN_PASSPORT) bindRequestScope(controller.signal, scope.data);
        if (signal.aborted || timeoutSignal.aborted) abort();
        return Promise.resolve(fetchRows(controller.signal)).finally(() => {
          signal.removeEventListener('abort', abort);
          timeoutSignal.removeEventListener('abort', abort);
        });
      });
      if (signal.aborted) throw new DOMException('Cancelled', 'AbortError');
      if (MAIN_PASSPORT) {
        await verifyCurrentScope(scope.data, signal);
        if (!matchesScope(scope.data, currentScope.current)) throw scopeChanged();
      }
      const result = MAIN_PASSPORT ? newestFirst(rows) : rotateFeed(rows, { people: ['people', 'new-pals'].includes(kind) });
      return MAIN_PASSPORT ? { rows: result, scope: scope.data } : result;
    },
    refetchOnMount: 'always',
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    networkMode: 'always',
    enabled: !!user?.id && enabled && (!MAIN_PASSPORT || !!scope.data?.country && !!scope.data?.fingerprint),
    staleTime: 30_000,
    retry: false,
  });
  const reset = async () => {
    const predicate = q => q.queryKey[0] === 'discovery' && q.queryKey[2] === user?.id &&
      (['people', 'new-pals'].includes(kind) ? ['people', 'new-pals'].includes(q.queryKey[1]) : q.queryKey[1] === kind);
    await client.cancelQueries({ predicate });
    await client.resetQueries({ predicate });
  };
  return { ...query, ...(MAIN_PASSPORT ? { data: !query.isError && matchesScope(query.data?.scope, scope.data) ? query.data.rows : [] } : {}), ...((MAIN_PASSPORT && !scope.data?.country) ? { data: [], isError: scope.isError || !scope.isPending, isPending: scope.isPending, isLoading: scope.isPending } : {}), reset };
}
