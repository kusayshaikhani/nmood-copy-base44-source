import React, { useState, useEffect, useMemo, useRef } from 'react';
import { SlidersHorizontal, X, Users, Circle, Calendar, Layers } from 'lucide-react';
import SearchBar from '@/components/search/SearchBar';
import ActivityResult from '@/components/search/ActivityResult';
import PersonResult from '@/components/search/PersonResult';
import RecentSearches from '@/components/search/RecentSearches';
import TrendingSearches from '@/components/search/TrendingSearches';
import SearchEmpty from '@/components/search/SearchEmpty';
import UnifiedSearchFilters from '@/components/search/UnifiedSearchFilters';
import { trendingSearches, useSearchPeople, computeSearchCategories } from '@/lib/search-live';
import { useExperiences } from '@/lib/discover-store';
import { isExperienceExpired } from '@/lib/discover-engine';
import { useMergedCircles } from '@/lib/circle-store';
import { useAuth } from '@/lib/AuthContext';
import { useSafety } from '@/lib/safety-store';
import { trackProductEvent, PRODUCT_EVENTS } from '@/lib/product-analytics';
import { track } from '@/lib/performance-monitor';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { categoryLabel } from '@/lib/i18n/label-resolvers';
import { useSearchState } from '@/hooks/useSearchState';
import { lookingForTagLabel, zodiacLabel } from '@/lib/looking-for-tags';
import { haversineKm } from '@/lib/distance-utils';
import { getRemainingSpots } from '@/lib/discover-engine';

const TABS = [
  { id: 'all', labelKey: 'search.tab.all', icon: Layers },
  { id: 'pals', labelKey: 'search.tab.pals', icon: Users },
  { id: 'experiences', labelKey: 'search.tab.experiences', icon: Calendar },
  { id: 'circles', labelKey: 'search.tab.circles', icon: Circle },
];

export default function Search() {
  const [query, setQuery] = useState(() => {
    try { return sessionStorage.getItem('inmood_search_query') || ''; } catch { return ''; }
  });
  const [searchState, setSearchState] = useSearchState({ tab: 'all', filters: {} });
  const tab = searchState.tab;
  const setTab = (t) => setSearchState((p) => ({ ...p, tab: t, filters: t === p.tab ? p.filters : {} }));

  // PALS-001 — deep-link to a specific tab via ?tab= (e.g. Home "Find Pals"), and
  // migrate the old 'people' tab id to 'pals' for users with stale sessionStorage.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const deepTab = params.get('tab');
    if (deepTab && TABS.some((tb) => tb.id === deepTab)) {
      setSearchState((p) => ({ ...p, tab: deepTab, filters: {} }));
    } else if (searchState.tab === 'people') {
      setSearchState((p) => ({ ...p, tab: 'pals' }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const filters = searchState.filters || {};
  const setFilters = (updater) => setSearchState((p) => ({ ...p, filters: typeof updater === 'function' ? updater(p.filters) : updater }));
  const [showFilters, setShowFilters] = useState(false);
  const { isBlocked } = useSafety();
  const { member } = useAuth();
  const [recentSearches, setRecentSearches] = useState([]);
  const mergedCircles = useMergedCircles();
  const { experiences: allExperiences } = useExperiences();
  const { members } = useSearchPeople();
  const { t } = useLocalization();

  const [locationOverride, setLocationOverride] = useState(null);
  const memberLocation = useMemo(() => {
    if (locationOverride) return locationOverride;
    if (typeof member?.latitude === 'number' && typeof member?.longitude === 'number') {
      return { lat: member.latitude, lng: member.longitude };
    }
    return null;
  }, [member, locationOverride]);

  const searchableExperiences = useMemo(
    () => (allExperiences || []).filter((e) => !isExperienceExpired(e)),
    [allExperiences]
  );

  const searchCategories = useMemo(() => computeSearchCategories(allExperiences), [allExperiences]);
  const experienceCategories = useMemo(() => [...new Set(searchableExperiences.map((e) => e.category).filter(Boolean))], [searchableExperiences]);
  const circleCategories = useMemo(() => [...new Set(mergedCircles.map((c) => c.category || (c.shared_interests && c.shared_interests[0])).filter(Boolean))], [mergedCircles]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('inmood_recent_searches');
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  const searchStart = useRef(performance.now());
  useEffect(() => {
    if (!query) { searchStart.current = performance.now(); return; }
    const elapsed = Math.max(performance.now() - searchStart.current, 1);
    track('search_response', Math.round(elapsed), 'search', { query: query.slice(0, 50) });
    searchStart.current = performance.now();
  }, [query, tab, filters]);

  const saveRecentSearch = (q) => {
    if (!q.trim()) return;
    const updated = [q, ...recentSearches.filter((s) => s !== q)].slice(0, 10);
    setRecentSearches(updated);
    try { localStorage.setItem('inmood_recent_searches', JSON.stringify(updated)); } catch { /* ignore */ }
  };

  useEffect(() => {
    try { sessionStorage.setItem('inmood_search_query', query); } catch { /* ignore */ }
  }, [query]);

  const handleSubmit = () => { trackProductEvent(PRODUCT_EVENTS.SEARCH_PERFORMED); saveRecentSearch(query); };
  const handleSelectSearch = (q) => { setQuery(q); saveRecentSearch(q); };
  const removeRecent = (index) => {
    const updated = recentSearches.filter((_, i) => i !== index);
    setRecentSearches(updated);
    try { localStorage.setItem('inmood_recent_searches', JSON.stringify(updated)); } catch { /* ignore */ }
  };
  const clearRecent = () => {
    setRecentSearches([]);
    try { localStorage.removeItem('inmood_recent_searches'); } catch { /* ignore */ }
  };

  // --- Text search across entity fields ---
  const textMatches = (text, q) => (text || '').toLowerCase().includes(q);

  const palsResults = useMemo(() => {
    if (!query.trim() && !hasActiveFilters(filters)) return [];
    const q = query.toLowerCase();
    let results = members.filter((p) => !isBlocked(p.id));

    // Text search
    if (query.trim()) {
      results = results.filter((p) =>
        textMatches(p.name, q) ||
        (p.interests || []).some((i) => i.toLowerCase().includes(q)) ||
        (p.languages || []).some((l) => l.toLowerCase().includes(q)) ||
        (p.looking_for_tags || []).some((tag) => tag.toLowerCase().includes(q)) ||
        textMatches(p.zodiac, q) ||
        textMatches(p.city, q) ||
        textMatches(p.bio, q)
      );
    }

    // Filter: looking_for (OR within group)
    if (filters.looking_for?.length) {
      results = results.filter((p) => (p.looking_for_tags || []).some((tag) => filters.looking_for.includes(tag)));
    }
    // Filter: languages (OR)
    if (filters.languages?.length) {
      results = results.filter((p) => (p.languages || []).some((lang) => filters.languages.some((f) => lang.toLowerCase().includes(f.toLowerCase()))));
    }
    // Filter: zodiac (OR)
    if (filters.zodiac?.length) {
      results = results.filter((p) => filters.zodiac.includes(p.zodiac));
    }
    // Filter: interests (OR)
    if (filters.interests?.length) {
      results = results.filter((p) => (p.interests || []).some((i) => filters.interests.includes(i)));
    }
    // Filter: distance (OR — pick closest match)
    if (filters.distance?.length && memberLocation) {
      const maxDist = Math.max(...filters.distance.map(Number));
      results = results.filter((p) => {
        const d = haversineKm(memberLocation.lat, memberLocation.lng, p.latitude, p.longitude);
        return d != null && d <= maxDist;
      });
    }
    // Filter: gender (single-select — Men/Women; Everyone = no filter)
    if (filters.gender?.length) {
      const genderMap = { men: 'male', women: 'female' };
      const targetGenders = filters.gender.map((g) => genderMap[g]).filter(Boolean);
      if (targetGenders.length) results = results.filter((p) => targetGenders.includes(p.gender));
    }
    // Filter: age range (inclusive — only members with valid derived age)
    const ageMin = filters.age_min != null ? filters.age_min : 18;
    const ageMax = filters.age_max != null ? filters.age_max : 99;
    if (ageMin !== 18 || ageMax !== 99) {
      results = results.filter((p) => p.age != null && p.age >= ageMin && p.age <= ageMax);
    }
    // Filter: pals distance (single-select — 5/10/25/50 km; Anywhere = no filter)
    if (filters.pals_distance?.length && memberLocation) {
      const maxDist = Math.max(...filters.pals_distance.map(Number));
      results = results.filter((p) => {
        const d = haversineKm(memberLocation.lat, memberLocation.lng, p.latitude, p.longitude);
        return d != null && d <= maxDist;
      });
    }
    return results;
  }, [query, filters, members, isBlocked, memberLocation]);

  const circlesResults = useMemo(() => {
    if (!query.trim() && !hasActiveFilters(filters)) return [];
    const q = query.toLowerCase();
    let results = mergedCircles
      .filter((c) => (!c.status || c.status === 'active') && (c.privacy === 'public' || c.privacy === 'approval'));

    // Text search
    if (query.trim()) {
      results = results.filter((c) =>
        textMatches(c.name, q) ||
        (c.shared_interests || []).some((i) => i.toLowerCase().includes(q)) ||
        textMatches(c.category, q) ||
        textMatches(c.location, q)
      );
    }

    // Filter: category (OR)
    if (filters.category?.length) {
      results = results.filter((c) => filters.category.includes(c.category) || (c.shared_interests || []).some((i) => filters.category.includes(i)));
    }
    // Filter: privacy (OR)
    if (filters.privacy?.length) {
      results = results.filter((c) => filters.privacy.includes(c.privacy));
    }
    // Filter: distance (OR — pick closest)
    if (filters.distance?.length && memberLocation) {
      const maxDist = Math.max(...filters.distance.map(Number));
      results = results.filter((c) => {
        const d = haversineKm(memberLocation.lat, memberLocation.lng, c.location_lat, c.location_lng);
        return d != null && d <= maxDist;
      });
    }
    // Filter: group_size (OR)
    if (filters.group_size?.length) {
      results = results.filter((c) => {
        const max = c.max_members || c.member_count || 0;
        return filters.group_size.some((size) => {
          if (size === 'small') return max > 0 && max <= 10;
          if (size === 'medium') return max > 10 && max <= 50;
          if (size === 'large') return max > 50;
          return false;
        });
      });
    }
    return results;
  }, [query, filters, mergedCircles, memberLocation]);

  const experiencesResults = useMemo(() => {
    if (!query.trim() && !hasActiveFilters(filters)) return [];
    const q = query.toLowerCase();
    let results = [...searchableExperiences];

    // Text search
    if (query.trim()) {
      results = results.filter((e) =>
        textMatches(e.title, q) ||
        textMatches(e.category, q) ||
        textMatches(e.location, q) ||
        textMatches(e.description, q)
      );
    }

    // Filter: category (OR)
    if (filters.category?.length) {
      results = results.filter((e) => filters.category.includes(e.category));
    }
    // Filter: date (OR)
    if (filters.date?.length) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
      const weekendStart = new Date(today);
      const day = today.getDay();
      const offsetToSaturday = (6 - day + 7) % 7;
      weekendStart.setDate(today.getDate() + offsetToSaturday);
      const weekendEnd = new Date(weekendStart); weekendEnd.setDate(weekendStart.getDate() + 1);
      const weekEnd = new Date(today); weekEnd.setDate(today.getDate() + 7);

      results = results.filter((e) => {
        if (!e.date) return false;
        const expDate = new Date(e.date);
        return filters.date.some((d) => {
          if (d === 'today') return expDate.toDateString() === today.toDateString();
          if (d === 'tomorrow') return expDate.toDateString() === tomorrow.toDateString();
          if (d === 'weekend') return expDate >= weekendStart && expDate <= weekendEnd;
          if (d === 'week') return expDate >= today && expDate <= weekEnd;
          return false;
        });
      });
    }
    // Filter: distance (OR)
    if (filters.distance?.length && memberLocation) {
      const maxDist = Math.max(...filters.distance.map(Number));
      results = results.filter((e) => {
        const d = haversineKm(memberLocation.lat, memberLocation.lng, e.location_lat, e.location_lng);
        return d != null && d <= maxDist;
      });
    }
    // Filter: price (OR)
    if (filters.price?.length) {
      results = results.filter((e) => {
        const isFree = !e.budget_amount || e.budget_amount === 0 || e.budget === 'Free';
        return filters.price.some((p) => (p === 'free' && isFree) || (p === 'paid' && !isFree));
      });
    }
    // Filter: spots (OR)
    if (filters.spots?.length) {
      results = results.filter((e) => filters.spots.includes('available') && getRemainingSpots(e) > 0);
    }
    return results;
  }, [query, filters, searchableExperiences, memberLocation]);

  // --- Aggregate results for "All" tab ---
  const allResults = useMemo(() => {
    if (tab !== 'all') return null;
    return [
      ...(experiencesResults.length > 0 ? [{ type: 'experiences', items: experiencesResults }] : []),
      ...(circlesResults.length > 0 ? [{ type: 'circles', items: circlesResults }] : []),
      ...(palsResults.length > 0 ? [{ type: 'people', items: palsResults }] : []),
    ];
  }, [tab, experiencesResults, circlesResults, palsResults]);

  const hasAnyResults = palsResults.length > 0 || circlesResults.length > 0 || experiencesResults.length > 0;
  const ageFilterActive = (filters.age_min != null && filters.age_min !== 18) || (filters.age_max != null && filters.age_max !== 99);
  const activeFilterCount = Object.values(filters).reduce((sum, arr) => sum + (arr?.length || 0), 0) + (ageFilterActive ? 1 : 0);
  const showResults = query.trim() || activeFilterCount > 0;

  const availableCategories = tab === 'circles' ? circleCategories : tab === 'experiences' ? experienceCategories : [...new Set([...circleCategories, ...experienceCategories])];

  const removeFilter = (group, value) => {
    setFilters((prev) => ({
      ...prev,
      [group]: (prev[group] || []).filter((v) => v !== value),
    }));
  };

  const clearAllFilters = () => setFilters({});

  // Render active filter chips
  const renderFilterChips = () => {
    if (activeFilterCount === 0) return null;
    const chips = [];
    // Age chip (range, not array)
    if (ageFilterActive) {
      const min = filters.age_min != null ? filters.age_min : 18;
      const max = filters.age_max != null ? filters.age_max : 99;
      chips.push(
        <button
          key="age-range"
          type="button"
          onClick={() => setFilters((prev) => {
            const { age_min, age_max, ...rest } = prev;
            return rest;
          })}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium transition-default hover:bg-primary/15 min-h-[36px]"
        >
          {t('search.filter.age')}: {min}–{max}
          <X className="w-3 h-3" />
        </button>
      );
    }
    Object.entries(filters).forEach(([group, values]) => {
      if (!Array.isArray(values)) return;
      values.forEach((v) => {
        let label = v;
        if (group === 'looking_for') label = lookingForTagLabel(t, v);
        else if (group === 'zodiac') label = zodiacLabel(t, v);
        else if (group === 'interests' || group === 'category') label = categoryLabel(t, v);
        else if (group === 'distance') label = t(`search.filter.distance_${v}km`);
        else if (group === 'date') label = t(`search.filter.date_${v}`);
        else if (group === 'price') label = t(`search.filter.price_${v}`);
        else if (group === 'privacy') label = t(`circle.privacy_${v}`);
        else if (group === 'group_size') label = t(`search.filter.group_size_${v}`);
        else if (group === 'gender') label = t(`search.filter.gender_${v}`);
        else if (group === 'pals_distance') label = t(`search.filter.pals_distance_${v}`);
        else if (group === 'spots') label = t('search.filter.spots_available');
        chips.push(
          <button
            key={`${group}-${v}`}
            type="button"
            onClick={() => removeFilter(group, v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium transition-default hover:bg-primary/15 min-h-[36px]"
          >
            {label}
            <X className="w-3 h-3" />
          </button>
        );
      });
    });
    return (
      <div className="flex flex-wrap gap-2 items-center">
        {chips}
        <button type="button" onClick={clearAllFilters} className="text-xs text-muted-foreground hover:text-foreground transition-default underline min-h-[36px] px-2">
          {t('search.clear_all')}
        </button>
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <SearchBar value={query} onChange={setQuery} onSubmit={handleSubmit} onClear={() => setQuery('')} />

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar overscroll-x-contain -mx-4 px-4 sm:mx-0 sm:px-0">
        {TABS.map((tb) => {
          const Icon = tb.icon;
          const isActive = tab === tb.id;
          return (
            <button
              key={tb.id}
              type="button"
              onClick={() => setTab(tb.id)}
              aria-pressed={isActive}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium flex-shrink-0 transition-default border min-h-[44px] ${
                isActive
                  ? 'bg-nmood-cta text-white border-transparent shadow-sm shadow-primary/25'
                  : 'bg-card text-muted-foreground border-border hover:border-primary/30'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t(tb.labelKey)}
            </button>
          );
        })}
      </div>

      {/* Filter button + active chips */}
      {tab !== 'all' && (
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => setShowFilters(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium border border-border bg-card text-foreground hover:border-primary/30 transition-default min-h-[44px]"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {t('search.filters')}
            {activeFilterCount > 0 && (
              <span className="ml-0.5 flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>
          {renderFilterChips()}
        </div>
      )}

      {/* Content */}
      {!showResults ? (
        <div className="space-y-6">
          <RecentSearches searches={recentSearches} onRemove={removeRecent} onClear={clearRecent} onSelect={handleSelectSearch} />
          <TrendingSearches items={trendingSearches} onSelect={handleSelectSearch} />
          {searchCategories.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3">{t('search.browse_categories')}</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {searchCategories.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <button key={cat.id} type="button" className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-card hover:shadow-md transition-default min-h-[44px]">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <p className="text-xs font-medium">{categoryLabel(t, cat.name)}</p>
                      <p className="text-[10px] text-muted-foreground">{cat.count}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : !hasAnyResults ? (
        <SearchEmpty query={query} />
      ) : (
        <div className="space-y-6">
          {tab === 'all' && allResults?.map((section) => (
            <div key={section.type}>
              <h3 className="text-sm font-semibold mb-2">
                {section.type === 'experiences' && t('search.section.experiences')}
                {section.type === 'circles' && t('search.section.circles')}
                {section.type === 'people' && t('search.section.pals')}
                {' '}
                ({section.items.length})
              </h3>
              {section.type === 'people' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {section.items.map((p) => <PersonResult key={p.id} person={p} />)}
                </div>
              ) : (
                <div className="space-y-2">
                  {section.items.map((item) => <ActivityResult key={item.id} result={item} />)}
                </div>
              )}
            </div>
          ))}

          {tab === 'pals' && palsResults.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2">{t('search.section.pals')} ({palsResults.length})</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {palsResults.map((p) => <PersonResult key={p.id} person={p} />)}
              </div>
            </div>
          )}

          {tab === 'circles' && circlesResults.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2">{t('search.section.circles')} ({circlesResults.length})</h3>
              <div className="space-y-2">
                {circlesResults.map((c) => (
                  <ActivityResult key={c.id} result={{
                    id: c.id,
                    type: 'circle',
                    title: c.name,
                    image: c.cover_photo,
                    category: (c.shared_interests && c.shared_interests[0]) || c.category || 'Community',
                    time: 'Ongoing',
                  }} />
                ))}
              </div>
            </div>
          )}

          {tab === 'experiences' && experiencesResults.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2">{t('search.section.experiences')} ({experiencesResults.length})</h3>
              <div className="space-y-2">
                {experiencesResults.map((a) => (
                  <ActivityResult key={a.id} result={{
                    id: a.id,
                    type: 'experience',
                    title: a.title,
                    image: a.cover_image || a.image,
                    category: a.category,
                    time: a.time,
                    date: a.date,
                  }} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <UnifiedSearchFilters
        tab={tab === 'all' ? 'pals' : tab}
        open={showFilters}
        onOpenChange={setShowFilters}
        filters={filters}
        onApply={setFilters}
        memberLocation={memberLocation}
        availableCategories={availableCategories}
        onLocationGranted={setLocationOverride}
      />
    </div>
  );
}

function hasActiveFilters(filters) {
  const f = filters || {};
  const hasArrayFilters = Object.values(f).some((arr) => Array.isArray(arr) && arr.length > 0);
  const hasAgeFilter = (f.age_min != null && f.age_min !== 18) || (f.age_max != null && f.age_max !== 99);
  return hasArrayFilters || hasAgeFilter;
}