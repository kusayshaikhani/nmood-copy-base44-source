import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useExperiences } from '@/lib/discover-store';
import { useJoinedExperienceIds } from '@/lib/activity-store';
import { rankFeed } from '@/lib/inmood-feed-engine';
import InMoodPeopleHero from '@/components/inmood/premium/InMoodPeopleHero';
import InMoodPeopleCategories from '@/components/inmood/premium/InMoodPeopleCategories';
import PersonDiscoveryCard from '@/components/inmood/premium/PersonDiscoveryCard';
import InMoodPeopleSkeleton from '@/components/inmood/premium/InMoodPeopleSkeleton';
import InMoodPeopleEmpty from '@/components/inmood/premium/InMoodPeopleEmpty';
import InMoodFilterSheet from '@/components/inmood/premium/InMoodFilterSheet';

const PAGE_SIZE = 6;

const PEOPLE_KEYWORDS = {
  AI: ['ai', 'artificial', 'tech', 'technology', 'startup', 'coding'],
  Food: ['food', 'drink', 'brunch', 'dinner', 'lunch', 'restaurant'],
  Outdoor: ['outdoor', 'outdoors', 'nature', 'hiking', 'trail', 'beach', 'sea'],
  Music: ['music', 'jazz', 'concert', 'live', 'dj', 'band'],
  Coffee: ['coffee', 'cafe', 'espresso'],
  Gaming: ['gaming', 'games', 'esports'],
  Sports: ['sports', 'tennis', 'padel', 'football', 'cycling', 'fitness', 'gym'],
  Movies: ['movie', 'movies', 'cinema', 'film'],
  Learning: ['learning', 'workshop', 'class', 'course', 'education', 'book'],
  Nightlife: ['nightlife', 'bar', 'club', 'party', 'drinks'],
  Travel: ['travel', 'trip', 'road trip'],
  Photography: ['photography', 'photo', 'camera'],
};

function matchesPeopleCategory(exp, category) {
  if (!category || category === 'All') return true;
  const keys = PEOPLE_KEYWORDS[category];
  if (!keys) return true;
  const cat = (exp.category || '').toLowerCase();
  const tags = (exp.tags || []).map((t) => t.toLowerCase());
  const title = (exp.title || '').toLowerCase();
  return keys.some((k) => cat.includes(k) || tags.some((t) => t.includes(k)) || title.includes(k));
}

export default function InMood() {
  const { member } = useAuth();
  const interests = member?.interests || [];

  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [filterOpen, setFilterOpen] = useState(false);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const loadMoreRef = useRef(null);

  const joinedIds = useJoinedExperienceIds();
  const { experiences, loading } = useExperiences();

  const ranked = useMemo(
    () => rankFeed(experiences, { emotion: 'surprise', energy: 'social', interests, joinedIds, filters, search }),
    [experiences, interests, joinedIds, filters, search]
  );

  const feed = useMemo(
    () => (category === 'All' ? ranked : ranked.filter((e) => matchesPeopleCategory(e, category))),
    [ranked, category]
  );

  // Reset pagination when the feed identity changes
  useEffect(() => { setPageSize(PAGE_SIZE); }, [category, search, filters]);

  const slice = feed.slice(0, pageSize);

  // Infinite scroll
  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && pageSize < feed.length) {
        setPageSize((p) => Math.min(p + PAGE_SIZE, feed.length));
      }
    }, { rootMargin: '300px' });
    if (loadMoreRef.current) obs.observe(loadMoreRef.current);
    return () => obs.disconnect();
  }, [feed.length, pageSize]);

  const activeFilterCount = [
    filters.when,
    filters.distance && filters.distance < 50,
    ...['free', 'paid', 'verified', 'trending', 'newest', 'friends', 'nearby', 'indoor', 'outdoor', 'accessibility'].map((k) => filters[k]),
  ].filter(Boolean).length;

  const clearAll = () => { setCategory('All'); setSearch(''); setFilters({}); };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto w-full">
        <InMoodPeopleHero search={search} onSearchChange={setSearch} onFilter={() => setFilterOpen(true)} />

        <div className="relative -mt-6 nmood-shell px-4 pt-6 pb-28">
          {activeFilterCount > 0 && (
            <div className="mb-3">
              <button
                type="button"
                onClick={() => setFilters({})}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-primary/10 text-primary text-xs font-semibold"
              >
                {activeFilterCount} filters
                <span className="text-base leading-none">×</span>
              </button>
            </div>
          )}

          <InMoodPeopleCategories active={category} onChange={setCategory} />

          <div className="h-6" />

          {loading ? (
            <InMoodPeopleSkeleton />
          ) : slice.length === 0 ? (
            <InMoodPeopleEmpty onClear={clearAll} />
          ) : (
            <div className="space-y-[14px]">
              {slice.map((e, i) => (
                <PersonDiscoveryCard key={e.id} experience={e} index={i} />
              ))}
              {pageSize < feed.length && (
                <div ref={loadMoreRef} className="flex justify-center py-6">
                  <div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <InMoodFilterSheet open={filterOpen} onOpenChange={setFilterOpen} filters={filters} onApply={setFilters} />
    </div>
  );
}