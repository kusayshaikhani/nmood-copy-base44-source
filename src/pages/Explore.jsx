import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import ExploreHero from '@/components/explore/ExploreHero';
import DiscoverCard from '@/components/discover/DiscoverCard';
import DiscoverSkeleton from '@/components/discover/DiscoverSkeleton';
import DiscoverEmptyState from '@/components/discover/DiscoverEmptyState';
import DiscoverSectionReveal from '@/components/discover/DiscoverSectionReveal';
import DiscoverError from '@/components/discover/DiscoverError';
import ExperiencesNearYouCarousel from '@/components/discover/ExperiencesNearYouCarousel';
import AiPicksCard from '@/components/discover/AiPicksCard';
import TrendingCirclesSection from '@/components/discover/TrendingCirclesSection';
import MagicDoorCard from '@/components/discover/MagicDoorCard';
import ConciergeEntryCard from '@/components/discover/ConciergeEntryCard';
import UpcomingThisWeekendSection from '@/components/discover/UpcomingThisWeekendSection';
import ExploreMoreSection from '@/components/discover/ExploreMoreSection';
import LivePulseCard from '@/components/discover/LivePulseCard';
import DiscoveryInsight from '@/components/discover/DiscoveryInsight';
import RecommendedForYouSection from '@/components/discover/RecommendedForYouSection';
import MapView from '@/components/discover/MapView';
import FilterSheet from '@/components/discover/FilterSheet';
import SearchResultCard from '@/components/discover/SearchResultCard';
import CommunitySection from '@/components/communities/CommunitySection';
import CommunitiesNearYouSection from '@/components/discover/CommunitiesNearYouSection';
import CircleCard from '@/components/circles/CircleCard';
import PalsExploreSection from '@/components/explore/PalsExploreSection';
import { useExperiences, computeFeatured, computeRecommended, computePopular } from '@/lib/discover-store';
import { useCommunities } from '@/lib/communities-live';
import { useMergedCircles } from '@/lib/circle-store';
import { searchExperiences, smartSort, getRemainingSpots } from '@/lib/discover-engine';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { onGlobalRefresh } from '@/lib/interactions';
import { queryClientInstance } from '@/lib/query-client';

const typeFilters = ['All', 'Pals', 'Experiences', 'Circles'];
const TYPE_LABEL_KEYS = {
  'All': 'discovery.type.all',
  'Pals': 'discovery.type.pals',
  'Experiences': 'discovery.type.experiences',
  'Circles': 'discovery.type.circles',
};

/**
 * UI-004 — Premium Explore (Experiences) page.
 * Purple gradient hero → large rounded white content container → floating FAB.
 * All filtering, search, view-toggle, type/quick/advanced filter logic preserved.
 */
export default function Explore() {
  const [view, setView] = useState(() => localStorage.getItem('discoverView') || 'cards');
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('for_you');
  const [typeFilter, setTypeFilter] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState(false);
  const allCircles = useMergedCircles();
  const { experiences, loading: expLoading } = useExperiences();
  const { communities: allCommunities } = useCommunities();
  const featured = useMemo(() => computeFeatured(experiences), [experiences]);
  const recommended = useMemo(() => computeRecommended(experiences), [experiences]);
  const popular = useMemo(() => computePopular(experiences), [experiences]);
  const { t } = useLocalization();

  useEffect(() => {
    const loc = searchParams.get('location');
    if (loc) setSearch(loc);
  }, [searchParams]);

  // Pull-to-refresh: invalidate queries to refetch experiences/circles.
  useEffect(() => {
    return onGlobalRefresh(() => {
      queryClientInstance.invalidateQueries();
    });
  }, []);

  const handleViewChange = (v) => {
    setView(v);
    localStorage.setItem('discoverView', v);
  };

  const handleTypeChange = (tf) => {
    setTypeFilter(tf);
    if (tf === 'Circles' || tf === 'Communities') setActiveFilter('for_you');
  };

  const clearFilters = () => {
    setSearch('');
    setActiveFilter('for_you');
    setTypeFilter('All');
    setAdvancedFilters(null);
  };

  const handleRetry = () => {
    setError(false);
  };

  const applyQuickFilter = (exps) => {
    switch (activeFilter) {
      case 'nearby':
        return [...exps].sort((a, b) => {
          const da = parseFloat(String(a.distance || '').replace(/[^0-9.]/g, '')) || 9999;
          const db = parseFloat(String(b.distance || '').replace(/[^0-9.]/g, '')) || 9999;
          return da - db;
        });
      case 'trending':
        return [...exps].sort((a, b) => (b.spotsFilled || 0) - (a.spotsFilled || 0));
      case 'new':
        return exps.filter((e) => e.isNew || (e.tags || []).includes('new'));
      case 'for_you':
      default:
        return exps;
    }
  };

  const applyAdvancedFilters = (exps) => {
    if (!advancedFilters) return exps;
    let result = exps;
    if (advancedFilters.budget && advancedFilters.budget !== 'Any Budget') {
      if (advancedFilters.budget === 'Free') {
        result = result.filter((e) => e.budget === 'Free' || e.isFree);
      } else {
        result = result.filter((e) => {
          const amt = parseFloat(String(e.budget).replace(/[$]/g, '')) || 0;
          if (advancedFilters.budget === '$') return amt > 0 && amt <= 50;
          if (advancedFilters.budget === '$$') return amt > 50 && amt <= 100;
          if (advancedFilters.budget === '$$$') return amt > 100;
          return true;
        });
      }
    }
    if (advancedFilters.categories && advancedFilters.categories.length > 0) {
      result = result.filter((e) => advancedFilters.categories.includes(e.category));
    }
    if (advancedFilters.freeOnly) result = result.filter((e) => e.budget === 'Free' || e.isFree);
    if (advancedFilters.availableSpots) result = result.filter((e) => getRemainingSpots(e) > 0);
    if (advancedFilters.distance && advancedFilters.distance < 200) {
      result = result.filter((e) => {
        const dist = parseFloat(String(e.distance).replace(/[^0-9.]/g, '')) || 999;
        return dist <= advancedFilters.distance;
      });
    }
    return result;
  };

  const getFilteredExperiences = () => smartSort(applyAdvancedFilters(applyQuickFilter(experiences)) || []);

  const getSearchResults = () => {
    const q = search.toLowerCase();
    const expResults = searchExperiences(applyQuickFilter(experiences), search).map((e) => ({ ...e, type: 'experience' }));
    if (typeFilter === 'Experiences') return expResults;

    const circleResults = allCircles
      .filter((c) => (c.name || '').toLowerCase().includes(q) || (c.community_name || '').toLowerCase().includes(q) || (c.shared_interests || []).some((i) => i.toLowerCase().includes(q)))
      .map((c) => ({ ...c, type: 'circle' }));

    if (typeFilter === 'Circles') return circleResults;

    const communityResults = allCommunities
      .filter((c) => (c.name || '').toLowerCase().includes(q) || (c.category || '').toLowerCase().includes(q))
      .map((c) => ({ ...c, type: 'community' }));

    if (typeFilter === 'Communities') return communityResults;
    return [...expResults, ...circleResults, ...communityResults];
  };

  const getMapExperiences = () => applyAdvancedFilters(applyQuickFilter(experiences));

  const isBrowsing = !search && activeFilter === 'for_you' && !advancedFilters;

  const activeCommunities = [...allCommunities].sort((a, b) => (b.member_count || 0) - (a.member_count || 0)).slice(0, 10);
  const newCommunities = [...allCommunities].sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0)).slice(0, 10);
  const popularCommunities = [...allCommunities].sort((a, b) => (b.member_count || 0) - (a.member_count || 0)).slice(0, 10);
  const recommendedCircles = allCircles.filter((c) => (c.tags || []).includes('recommended') || (c.tags || []).includes('nearby'));
  const newCircles = allCircles.filter((c) => (c.tags || []).includes('new'));

  const renderContent = () => {
    if (expLoading) {
      return <DiscoverSkeleton />;
    }
    if (error) {
      return <DiscoverError onRetry={handleRetry} />;
    }
    if (view === 'map') {
      return <MapView experiences={getMapExperiences()} />;
    }

    // Pals tab — always show Pals results regardless of browsing/search state.
    if (typeFilter === 'Pals') {
      return <PalsExploreSection />;
    }

    if (search) {
      const results = getSearchResults();
      if (results.length === 0) {
        return (
          <DiscoverEmptyState
            title={t('discovery.empty.search_empty.title')}
            description={t('discovery.empty.search_empty.desc')}
            actionLabel={t('discovery.empty.search_empty.cta')}
            onAction={() => navigate('/host/create')}
          />
        );
      }
      return (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{t('discovery.results_found', { count: results.length })}</p>
          {results.map((item) => <SearchResultCard key={`${item.type}-${item.id}`} item={item} />)}
        </div>
      );
    }

    if (!isBrowsing) {
      if (typeFilter === 'Pals') {
        return <PalsExploreSection />;
      }
      if (typeFilter === 'Circles') {
        if (allCircles.length === 0) {
          return (
            <div className="p-6 rounded-card border border-dashed border-border text-center">
              <p className="text-sm font-medium">{t('discovery.empty.circles.title')}</p>
              <p className="text-xs text-muted-foreground mt-1">{t('discovery.empty.circles.desc')}</p>
            </div>
          );
        }
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {allCircles.map((c) => <CircleCard key={c.id} circle={c} />)}
          </div>
        );
      }
      if (typeFilter === 'Communities') {
        if (allCommunities.length === 0) {
          return (
            <div className="p-6 rounded-card border border-dashed border-border text-center">
              <p className="text-sm font-medium">{t('discovery.empty.communities.title')}</p>
              <p className="text-xs text-muted-foreground mt-1">{t('discovery.empty.communities.desc')}</p>
            </div>
          );
        }
        return <div className="space-y-6"><CommunitySection title={t('discovery.section.all_communities')} communities={allCommunities} /></div>;
      }
      const filteredExperiences = getFilteredExperiences();
      if (filteredExperiences.length === 0) {
        return (
          <DiscoverEmptyState
            title={t('discovery.empty.no_results.title')}
            description={t('discovery.empty.no_results.desc')}
            actionLabel={t('discovery.empty.no_results.cta')}
            onAction={clearFilters}
          />
        );
      }
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {filteredExperiences.map((exp) => <DiscoverCard key={exp.id} experience={exp} />)}
        </div>
      );
    }

    if (experiences.length === 0) {
      return (
        <div className="space-y-14">
          <DiscoverSectionReveal><ConciergeEntryCard /></DiscoverSectionReveal>
          <DiscoverEmptyState
            title={t('discovery.empty.no_adventures.title')}
            description={t('discovery.empty.no_adventures.desc')}
            actionLabel={t('discovery.empty.no_adventures.cta')}
            onAction={() => navigate('/host/create')}
          />
        </div>
      );
    }

    return (
      <div className="space-y-14">
        {/* Nmood AI Concierge — primary shortcut to the concierge */}
        <DiscoverSectionReveal><ConciergeEntryCard /></DiscoverSectionReveal>
        {/* Live pulse + discovery insight — real platform stats */}
        <DiscoverSectionReveal><LivePulseCard experiences={experiences} circles={allCircles} /></DiscoverSectionReveal>
        <DiscoverSectionReveal><DiscoveryInsight experiences={experiences} /></DiscoverSectionReveal>
        {/* Narrative flow: Featured → Ready to Explore → AI Picks →
            People Gathering → Magic Door → This Weekend → Explore More → Communities */}
        {typeFilter !== 'Circles' && typeFilter !== 'Communities' && <DiscoverSectionReveal><RecommendedForYouSection experiences={recommended.length > 0 ? recommended : experiences} /></DiscoverSectionReveal>}
        {typeFilter !== 'Circles' && typeFilter !== 'Communities' && <DiscoverSectionReveal><ExperiencesNearYouCarousel experiences={smartSort(experiences)} /></DiscoverSectionReveal>}
        {typeFilter !== 'Circles' && typeFilter !== 'Communities' && <DiscoverSectionReveal><AiPicksCard /></DiscoverSectionReveal>}
        {typeFilter !== 'Experiences' && typeFilter !== 'Communities' && <DiscoverSectionReveal><TrendingCirclesSection circles={recommendedCircles.length > 0 ? recommendedCircles : allCircles} /></DiscoverSectionReveal>}
        {typeFilter !== 'Circles' && typeFilter !== 'Communities' && <DiscoverSectionReveal><MagicDoorCard /></DiscoverSectionReveal>}
        {typeFilter !== 'Circles' && typeFilter !== 'Communities' && <DiscoverSectionReveal><UpcomingThisWeekendSection experiences={smartSort(experiences)} /></DiscoverSectionReveal>}
        <DiscoverSectionReveal><ExploreMoreSection /></DiscoverSectionReveal>
        {typeFilter !== 'Experiences' && typeFilter !== 'Circles' && (
          <DiscoverSectionReveal>
            <CommunitiesNearYouSection communities={activeCommunities} />
          </DiscoverSectionReveal>
        )}
        {typeFilter !== 'Experiences' && typeFilter !== 'Circles' && <DiscoverSectionReveal><CommunitySection title={t('discovery.section.new_communities')} communities={newCommunities} /></DiscoverSectionReveal>}
        {typeFilter !== 'Experiences' && typeFilter !== 'Circles' && <DiscoverSectionReveal><CommunitySection title={t('discovery.section.popular_communities')} communities={popularCommunities} /></DiscoverSectionReveal>}
      </div>
    );
  };

  return (
    <div className="bg-background min-h-full flex flex-col">
      <ExploreHero
        title={t('discovery.title')}
        subtitle={t('discovery.subtitle')}
        search={search}
        onSearchChange={(e) => setSearch(e.target.value)}
        view={view}
        onViewChange={handleViewChange}
        onOpenFilters={() => setShowFilters(true)}
        activeChip={activeFilter}
        onChipChange={setActiveFilter}
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="relative -mt-8 rounded-t-[32px] bg-card px-6 pt-6 pb-24 flex-1 space-y-8"
      >
        {/* Premium type filter chips */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar overscroll-x-contain">
          {typeFilters.map((tf) => (
            <button
              key={tf}
              onClick={() => handleTypeChange(tf)}
              type="button"
              className={`px-4 py-2 rounded-full text-sm font-medium flex-shrink-0 transition-default border snap-start ${
                typeFilter === tf
                  ? 'bg-nmood-cta text-white border-transparent shadow-sm shadow-primary/25'
                  : 'bg-card text-muted-foreground border-border hover:border-primary/30'
              }`}
            >
              {t(TYPE_LABEL_KEYS[tf])}
            </button>
          ))}
        </div>

        {/* Content */}
        {renderContent()}
      </motion.div>

      <FilterSheet
        open={showFilters}
        onOpenChange={setShowFilters}
        onApply={setAdvancedFilters}
        initialFilters={advancedFilters}
      />

      {/* Persistent Host FAB — flex-shrink-0 footer above MobileNav */}
      <div className="sticky bottom-0 flex-shrink-0 flex justify-end px-4 pt-3 pb-3 bg-background border-t border-border/50 z-30">
        <button
          onClick={() => navigate('/host/create')}
          aria-label={t('discovery.aria.host_experience')}
          type="button"
          className="flex items-center gap-2 h-14 px-6 rounded-full bg-nmood-gradient text-primary-foreground shadow-float hover-lift transition-default"
        >
          <Plus className="w-5 h-5" />
          <span className="font-semibold text-sm">{t('home.host')}</span>
        </button>
      </div>
    </div>
  );
}