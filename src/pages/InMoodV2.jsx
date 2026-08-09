import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { useExperiences } from '@/lib/discover-store';
import { useJoinedExperienceIds } from '@/lib/activity-store';
import { rankFeed } from '@/lib/inmood-feed-engine';
import V2Header from '@/components/inmood/v2/V2Header';
import V2SearchFilters from '@/components/inmood/v2/V2SearchFilters';
import V2CategoryChips from '@/components/inmood/v2/V2CategoryChips';
import PersonDiscoveryCard from '@/components/inmood/v2/PersonDiscoveryCard';
import V2FeedSkeleton from '@/components/inmood/v2/V2FeedSkeleton';
import V2FeedEmpty from '@/components/inmood/v2/V2FeedEmpty';
import V2FilterSheet from '@/components/inmood/v2/V2FilterSheet';
import V2FeedSection from '@/components/inmood/v2/V2FeedSection';
import V2RecommendationCard from '@/components/inmood/v2/V2RecommendationCard';
import moment from 'moment';
import { expStartMoment } from '@/lib/experience-utils';

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
  const tags = (exp.tags || []).map((x) => x.toLowerCase());
  const title = (exp.title || '').toLowerCase();
  return keys.some((k) => cat.includes(k) || tags.some((t) => t.includes(k)) || title.includes(k));
}

const SECTION_ORDER = ['best', 'soon', 'nearby', 'today', 'ai'];

const RANK = {
  best: { label: 'Best Match', tone: 'primary' },
  soon: { label: 'Trending', tone: 'amber' },
  nearby: { label: 'Nearby', tone: 'emerald' },
  today: { label: 'Active', tone: 'sky' },
  ai: { label: 'AI Pick', tone: 'violet' },
};

function sectionOf(exp) {
  if ((exp.tags || []).includes('ai-pick') || exp.isAiPick) return 'ai';
  if (exp.created_date && Date.now() - new Date(exp.created_date).getTime() < 86400000) return 'today';
  const m = expStartMoment(exp);
  if (m && m.isValid()) {
    const diff = m.diff(moment());
    if (diff >= 0 && diff <= 36 * 3600000) return 'soon';
  }
  const d = parseFloat(exp.distance);
  if (!isNaN(d) && d <= 3) return 'nearby';
  return 'best';
}

export default function InMoodV2() {
  const navigate = useNavigate();
  const { member } = useAuth();
  const interests = member?.interests || [];

  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [filterOpen, setFilterOpen] = useState(false);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const searchRef = useRef(null);
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

  useEffect(() => { setPageSize(PAGE_SIZE); }, [category, search, filters]);

  const slice = feed.slice(0, pageSize);

  const groups = useMemo(() => {
    const map = { best: [], soon: [], nearby: [], today: [], ai: [] };
    slice.forEach((e) => map[sectionOf(e)].push(e));

    const REC_TYPES = ['ai_pick', 'explore_new', 'shared_interests'];
    let recIdx = 0;
    const buildRec = (exp) => {
      const hostName = exp.host?.name || 'this member';
      const cat = (exp.category || 'this plan').toLowerCase();
      const tags = (exp.tags || []).slice(0, 3);
      const shared = tags.filter((t) => interests.some((i) => i.toLowerCase() === t.toLowerCase()));
      const type = REC_TYPES[recIdx % 3];
      recIdx += 1;
      if (type === 'ai_pick') {
        return {
          type,
          headline: 'AI Pick for You',
          subtitle: `Based on your interests, ${hostName} might be a great match for today's ${cat} plan.`,
          onClick: () => navigate(`/experience/${exp.id}`),
        };
      }
      if (type === 'explore_new') {
        const topInt = (interests[0] || 'coffee').toLowerCase();
        const suggestion = tags.find((t) => !interests.some((i) => i.toLowerCase() === t.toLowerCase())) || 'a photography walk';
        return {
          type,
          headline: 'Explore Something New',
          subtitle: `You usually choose ${topInt}. How about trying ${suggestion}?`,
          onClick: () => navigate('/explore'),
        };
      }
      const sharedList = (shared.length ? shared : tags).join(', ');
      return {
        type,
        headline: 'Shared Interests',
        subtitle: `You and ${hostName} share ${sharedList}.`,
        onClick: () => navigate(`/experience/${exp.id}`),
      };
    };

    return SECTION_ORDER.map((id) => {
      const items = map[id];
      const nodes = [];
      items.forEach((e, i) => {
        nodes.push({ kind: 'card', exp: e, index: i });
        if (i > 0 && (i + 1) % 3 === 0 && i < items.length - 1) {
          nodes.push({ kind: 'rec', rec: buildRec(e) });
        }
      });
      return { id, nodes };
    }).filter((s) => s.nodes.length > 0);
  }, [slice, interests, navigate]);

  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && pageSize < feed.length) {
        setPageSize((p) => Math.min(p + PAGE_SIZE, feed.length));
      }
    }, { rootMargin: '300px' });
    if (loadMoreRef.current) obs.observe(loadMoreRef.current);
    return () => obs.disconnect();
  }, [feed.length, pageSize]);

  const activeFilterCount = Object.keys(filters || {}).filter((k) => filters[k]).length;
  const clearAll = () => { setCategory('All'); setSearch(''); setFilters({}); };

  const emptyVariant = !interests.length
    ? 'new_member'
    : (activeFilterCount > 0 || search.trim())
      ? 'filters'
      : 'nearby';

  return (
    <div className="bg-background min-h-screen flex flex-col">
      <V2Header />

      <div className="relative -mt-8 rounded-t-[32px] bg-card px-6 pt-8 pb-28 flex-1 animate-content-rise">
        <V2SearchFilters
          searchRef={searchRef}
          search={search}
          onSearchChange={setSearch}
          onOpenFilters={() => setFilterOpen(true)}
          activeCount={activeFilterCount}
          onClearFilters={() => setFilters({})}
        />

        <div className="mt-6">
          <V2CategoryChips active={category} onChange={setCategory} />

          <div className="mt-6">
            {loading ? (
              <V2FeedSkeleton />
            ) : slice.length === 0 ? (
              <V2FeedEmpty
                variant={emptyVariant}
                onExpandSearch={clearAll}
                onExploreAll={() => navigate('/explore')}
                onResetFilters={clearAll}
                onCompleteProfile={() => navigate('/onboarding')}
              />
            ) : (
              <div className="space-y-8 animate-fade-in">
                {groups.map((g) => (
                  <V2FeedSection key={g.id} id={g.id}>
                    {g.nodes.map((n, ni) =>
                      n.kind === 'card' ? (
                        <PersonDiscoveryCard
                          key={`c-${n.exp.id}`}
                          experience={n.exp}
                          index={n.index}
                          rankLabel={RANK[g.id].label}
                          rankTone={RANK[g.id].tone}
                        />
                      ) : (
                        <V2RecommendationCard key={`r-${g.id}-${ni}`} {...n.rec} />
                      )
                    )}
                  </V2FeedSection>
                ))}
                {pageSize < feed.length && (
                  <div ref={loadMoreRef} className="flex justify-center py-6">
                    <div className="w-5 h-5 border-2 border-muted border-t-primary rounded-full animate-spin" />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <V2FilterSheet open={filterOpen} onOpenChange={setFilterOpen} filters={filters} onApply={setFilters} />
    </div>
  );
}