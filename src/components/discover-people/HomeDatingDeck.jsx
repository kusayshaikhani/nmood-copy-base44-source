import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Capacitor } from '@capacitor/core';
import { callSupabaseRpc } from '@/api/supabaseClient';
import { usePassportScope } from '@/lib/passport/runtime';
import { matchesScope, scopeChanged, verifyCurrentScope } from '@/lib/passport/response';
import { searchRequest } from '@/lib/discovery-search-contract';
import { ANDROID_BACKGROUND_DECK_PAGES, ANDROID_INITIAL_DECK_BATCH, mergeDeckMembers } from '@/lib/home-deck-prefetch';
import DatingProfileDeck from './DatingProfileDeck';

export default function HomeDatingDeck() {
  const scope = usePassportScope();
  const isAndroid = Capacitor.getPlatform() === 'android';
  const [prefetchedPeople, setPrefetchedPeople] = useState([]);
  const query = useQuery({
    queryKey: ['home-dating-deck', scope.data?.actor, scope.data?.fingerprint],
    enabled: !!scope.data?.country && !scope.isError,
    retry: false,
    queryFn: async ({ signal }) => {
      const expected = scope.data;
      // Home must retain passed profiles after fresh cards are exhausted. The
      // recommendation endpoint intentionally omits profiles already seen by
      // the member, which makes a small local pool look empty. Fetch the
      // authorized people pool instead; DatingProfileDeck presents unseen
      // people first and only then cycles profiles the member disliked.
      const people = [];
      const seenIds = new Set();
      // Android starts with a compact, authorized batch so the first card is
      // available quickly. The remaining pages are filled in below while the
      // member is browsing, instead of holding the entire deck at loading.
      const pageSize = isAndroid ? ANDROID_INITIAL_DECK_BATCH : 50;
      const maximumPages = isAndroid ? 1 : 4;

      for (let page = 0; page < maximumPages; page += 1) {
        const request = { ...searchRequest('people', {}, '', page * pageSize, true), p_limit: pageSize };
        const envelope = await callSupabaseRpc('nmood_smart_search_discovery', { ...request, p_expected_fingerprint: expected.fingerprint }, { signal, expectedUserId: expected.actor });
        if (envelope?.contract !== 'smart-search-1' || !matchesScope(expected, envelope) || !Array.isArray(envelope.rows)) throw scopeChanged();

        const pageRows = envelope.rows.slice(0, pageSize);
        for (const member of pageRows) {
          if (member?.id && !seenIds.has(member.id)) {
            seenIds.add(member.id);
            people.push(member);
          }
        }
        if (envelope.rows.length <= pageSize) break;
      }

      await verifyCurrentScope(expected, signal);
      if (!matchesScope(expected, scope.data)) throw scopeChanged();
      return people;
    },
  });

  useEffect(() => {
    setPrefetchedPeople([]);
  }, [scope.data?.actor, scope.data?.fingerprint]);

  useEffect(() => {
    if (!isAndroid || !scope.data?.country || query.isLoading || query.isError || !query.data?.length) return undefined;
    const expected = scope.data;
    const initialIds = new Set(query.data.map(member => member?.id).filter(Boolean));
    let active = true;

    const prefetch = async () => {
      const pageSize = ANDROID_INITIAL_DECK_BATCH;
      for (let page = 1; page <= ANDROID_BACKGROUND_DECK_PAGES && active; page += 1) {
        try {
          const request = { ...searchRequest('people', {}, '', page * pageSize, true), p_limit: pageSize };
          const envelope = await callSupabaseRpc('nmood_smart_search_discovery', { ...request, p_expected_fingerprint: expected.fingerprint }, { expectedUserId: expected.actor });
          if (envelope?.contract !== 'smart-search-1' || !matchesScope(expected, envelope) || !Array.isArray(envelope.rows)) throw scopeChanged();
          await verifyCurrentScope(expected);
          if (!active || !matchesScope(expected, scope.data)) return;
          const newMembers = envelope.rows.filter(member => member?.id && !initialIds.has(member.id));
          newMembers.forEach(member => initialIds.add(member.id));
          if (newMembers.length) setPrefetchedPeople(current => [...current, ...newMembers.filter(member => !current.some(existing => existing.id === member.id))]);
          if (envelope.rows.length <= pageSize) return;
        } catch {
          // The visible batch remains usable; a later normal refresh retries.
          return;
        }
      }
    };
    void prefetch();
    return () => { active = false; };
  }, [isAndroid, query.data, query.isError, query.isLoading, scope.data]);

  const people = useMemo(() => mergeDeckMembers(query.data, prefetchedPeople), [query.data, prefetchedPeople]);

  if (scope.isPending || query.isLoading) return <div className="h-[32rem] animate-pulse rounded-[2rem] bg-muted" />;
  if (scope.isError || query.isError) return <section className="rounded-3xl border bg-card p-6 text-center"><h2 className="font-semibold">People are unavailable right now</h2><p className="mt-2 text-sm text-muted-foreground">Please try again in a moment.</p><button type="button" className="mt-4 min-h-11 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground" onClick={() => void query.refetch()}>Try again</button></section>;
  if (!scope.data?.country) return <section className="rounded-3xl border bg-card p-6 text-center"><h2 className="font-semibold">Set your discovery area</h2><p className="mt-2 text-sm text-muted-foreground">Add your country in Settings to see people nearby.</p></section>;
  return <DatingProfileDeck members={people} homeMode />;
}
