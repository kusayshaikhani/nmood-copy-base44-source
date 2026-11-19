import {useAuth} from '@/lib/AuthContext';
import {discoveryQuickResults} from '@/lib/discovery-controls';
import {discoveryErrorMessage} from '@/lib/discovery-error-message';
import {MAIN_PASSPORT} from '@/lib/passport/enabled';
import {useContractDiscovery} from '@/lib/use-contract-discovery';
import { searchDiscoveryRows } from '@/lib/discovery-text-search';
import DiscoveryStatus from '@/components/shared/DiscoveryStatus';
import React, { useState, useMemo } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { filterPeople } from '@/lib/people-search-filters';
import { useSearchPeople } from '@/lib/search-live';
import { useSafety } from '@/lib/safety-store';
import { useLocalization } from '@/lib/i18n/useLocalization';
import PersonResult from '@/components/search/PersonResult';
import UnifiedSearchFilters from '@/components/search/UnifiedSearchFilters';
import EmptyState from '@/components/shared/EmptyState';
import { Users } from 'lucide-react';

/**
 * Pals tab content for the Explore/Discover page.
 * Shows discoverable members in a grid with Pals filters (gender, age,
 * looking-for, shared marital/family values, interests, languages, zodiac).
 */
const usePeopleSource=MAIN_PASSPORT?((filters,query,pending,mode)=>useContractDiscovery('people',filters,query,!pending,mode)):useSearchPeople;
function PalsExploreSection({ query = '', searchPending = false, onClearSearch = () => {}, categories=[], filters:providedFilters, onFiltersChange, onReset, mode='for_you' }) {
  const {member}=useAuth();
  const { isBlocked } = useSafety();
  
  const { t } = useLocalization();
  const [showFilters, setShowFilters] = useState(false);
  const [localFilters,setLocalFilters]=useState({});
  const filters=providedFilters||localFilters;
  const setFilters=onFiltersChange||setLocalFilters;
  const effectiveFilters={...filters,interests:[...new Set([...(filters.interests||[]),...categories])]};
  if(mode==='in_orbit')effectiveFilters.orbit_interests=member?.interests?.length?member.interests:['__no_shared_interests__'];
  const data = usePeopleSource(effectiveFilters,query,searchPending,mode);
  const {loading,isError,isFetching,refetch,reset}=data;
  const members=MAIN_PASSPORT?data.rows:data.members;
  const results = useMemo(() => {
    const visible = members.filter(p => !isBlocked(p.id));
    // The Passport RPC is the privacy-aware source of truth for live
    // Discovery. Applying a second local interpretation can hide legitimate
    // server matches when the returned profile uses normalized values.
    const eligible = MAIN_PASSPORT ? visible : filterPeople(visible, filters);
    const searched = searchDiscoveryRows(eligible, 'people', query);
    return MAIN_PASSPORT ? discoveryQuickResults(searched,mode) : searched;
  }, [members, filters, isBlocked, query, mode]);

  const resetFilters = () => { setFilters({}); setShowFilters(false); onClearSearch(); onReset?.(); if(!MAIN_PASSPORT||(!query.trim()&&!Object.values(effectiveFilters).some(v=>Array.isArray(v)?v.length:v)))void(reset||refetch)?.(); };
  const activeFilterCount = Object.values(filters).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 1), 0);

  if (isError) return <DiscoveryStatus label="People" message={discoveryErrorMessage(data.error)} error onRetry={refetch} />;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {searchPending ? 'Searching people…' : loading ? t('search.loading') : `${results.length} ${results.length === 1 ? 'person' : 'people'}`}
        </p>
        <button
          type="button"
          onClick={() => setShowFilters(true)}
          className="min-h-11 flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-sm font-medium transition-default hover:border-primary/30 relative"
        >
          <SlidersHorizontal className="w-4 h-4" />
          {t('search.filters')}
          {activeFilterCount > 0 && (
            <span className="ml-0.5 min-w-4 h-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {MAIN_PASSPORT && <p className="text-xs text-muted-foreground">Any selected value within a field can match; all selected fields must match. Only details you are permitted to view can match a filter.</p>}
      {!MAIN_PASSPORT && (filters.age_min != null || filters.age_max != null) && members.some(p => p.age == null) && <p role="status" className="text-sm text-muted-foreground">Members who do not share their age remain included.</p>}
      {searchPending ? <p role="status">Updating search results…</p> : loading || isFetching ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl border border-border bg-card shimmer" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <EmptyState
          icon={Users}
          title={query ? `No people match ‘${query}’` : members.length ? 'No people match these filters' : 'No eligible people right now'}
          description={members.length ? 'Reset filters to see eligible public people.' : 'Try refreshing discovery again later.'}
          actionLabel="Reset filters" onAction={resetFilters}
        />
      ) : (
        <div className="discovery-grid">
          {results.map((p) => <PersonResult key={p.id} person={p} />)}
        </div>
      )}

      {MAIN_PASSPORT && data.hasNextPage && <button className="min-h-11 text-primary" disabled={isFetching} onClick={()=>data.fetchNextPage()}>Load more</button>}
      <UnifiedSearchFilters
        tab="pals"
        open={showFilters}
        onOpenChange={setShowFilters}
        filters={filters}
        onApply={setFilters}
        onReset={resetFilters}
      />
    </div>
  );
}

export default PalsExploreSection;
