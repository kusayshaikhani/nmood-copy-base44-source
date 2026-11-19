import {useDiscoveryState,clearDiscoveryState} from '@/lib/use-discovery-state';
import {peopleCategoryFilters,filtersForKind,supportsDiscoveryFilters,discoveryQuickResults,discoveryModeDescription} from '@/lib/discovery-controls';
import {useContractDiscovery} from '@/lib/use-contract-discovery';
import { MAIN_PASSPORT as MAIN_SEARCH_CONTRACT } from '@/lib/passport/enabled';
import ExplorerScopeNotice from '@/components/settings/passport/ExplorerScopeNotice';
import NmoodsHomeSection from '@/components/home/NmoodsHomeSection';
import { searchDiscoveryRows } from '@/lib/discovery-text-search';
import { useDiscoverySearch } from '@/lib/use-discovery-search';
import DiscoveryStatus from '@/components/shared/DiscoveryStatus';
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
import { useOriginState } from '@/lib/safe-navigation';
import UpgradeMembershipCTA from '@/components/membership/UpgradeMembershipCTA';
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
import PersonResult from '@/components/search/PersonResult';
import DiscoveryGallery from '@/components/discover/DiscoveryGallery';
import { useDiscoveryPeople } from '@/lib/use-discovery-people';
import PalsExploreSection from '@/components/explore/PalsExploreSection';
import { useExperiences, computeRecommended } from '@/lib/discover-store';
import { useCommunities } from '@/lib/communities-live';
import { useCircleDiscovery } from '@/lib/circle-store';
import { smartSort, getRemainingSpots } from '@/lib/discover-engine';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { useAuth } from '@/lib/AuthContext';

const useMainCircles=(filters,query,pending,mode)=>useContractDiscovery('circles',filtersForKind('circles',filters),query,!pending&&supportsDiscoveryFilters('circles',filters),mode);
const useMainPeople=(filters,query,pending,mode)=>useContractDiscovery('people',peopleCategoryFilters(filters),query,!pending&&supportsDiscoveryFilters('people',filters),mode);
const useMainExperiences=(filters,query,pending,mode)=>useContractDiscovery('experiences',filtersForKind('experiences',filters),query,!pending&&supportsDiscoveryFilters('experiences',filters),mode);
const useCirclesSource=MAIN_SEARCH_CONTRACT?useMainCircles:()=>useCircleDiscovery();
const usePeopleSource=MAIN_SEARCH_CONTRACT?useMainPeople:()=>useDiscoveryPeople();
const useExperiencesSource=MAIN_SEARCH_CONTRACT?useMainExperiences:()=>useExperiences();
const useCommunitiesSource=MAIN_SEARCH_CONTRACT?()=>({communities:[],loading:false}):useCommunities;
export const typeFilters = ['All', 'Nmood shares', 'Pals', 'Experiences', 'Circles'];
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
function LegacyExplore() {
  const {user,member}=useAuth();
  const [saved,setSaved]=useDiscoveryState(user?.id,'discover',{view:'cards',search:'',activeFilter:'for_you',typeFilter:'All',advancedFilters:null,peopleFilters:{}});
  const {view='cards',search='',activeFilter='for_you',typeFilter='All',advancedFilters=null,peopleFilters={}}=saved||{};
  const field=(key,value)=>setSaved(previous=>({...previous,[key]:typeof value==='function'?value(previous?.[key]):value}));
  const setView=value=>field('view',value),setSearch=value=>field('search',value),setActiveFilter=value=>field('activeFilter',value),setTypeFilter=value=>field('typeFilter',value),setAdvancedFilters=value=>field('advancedFilters',value),setPeopleFilters=value=>field('peopleFilters',value);
  const { query: searchQuery, pending: searchPending } = useDiscoverySearch(search);
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();
  const originState = useOriginState();
  const [searchParams,setSearchParams] = useSearchParams();
  const [error, setError] = useState(false);
  const mainCircles=useCirclesSource(advancedFilters,searchQuery,searchPending,activeFilter);
  const { circles: allCircles, loading: circlesLoading, isError: circlesError, refetch: retryCircles } = MAIN_SEARCH_CONTRACT?{...mainCircles,circles:mainCircles.rows}:mainCircles;
  const mainPosts=useContractDiscovery('posts',filtersForKind('posts',advancedFilters),searchQuery,MAIN_SEARCH_CONTRACT&&!searchPending&&supportsDiscoveryFilters('posts',advancedFilters),activeFilter);
  const mainPeople=usePeopleSource(advancedFilters,searchQuery,searchPending,activeFilter);
  const { members: allPeople, isLoading: peopleLoading, isError: peopleError, refetch: retryPeople } = MAIN_SEARCH_CONTRACT?{...mainPeople,members:mainPeople.rows}:mainPeople;
  const mainExperiences=useExperiencesSource(advancedFilters,searchQuery,searchPending,activeFilter);
  const { experiences, loading: expLoading, isError: expError, refetch: retryExperiences } = MAIN_SEARCH_CONTRACT?{...mainExperiences,experiences:mainExperiences.rows}:mainExperiences;
  const { communities: allCommunities, loading: communitiesLoading } = useCommunitiesSource();
  const recommended = useMemo(() => computeRecommended(experiences), [experiences]);
  const { t } = useLocalization();

  useEffect(() => {
    if (['people', 'pals'].includes(searchParams.get('tab'))) setTypeFilter('Pals');
    if (['nmoods', 'nmood-shares'].includes(searchParams.get('tab'))) setTypeFilter('Nmood shares');
    if (searchParams.get('tab') === 'circles') setTypeFilter('Circles');
    if(searchParams.get('tab')==='experiences')setTypeFilter('Experiences');
    const loc = searchParams.get('location');
    if (loc) setSearch(loc);
  }, [searchParams]);

  const handleViewChange = (v) => {
    setView(v);
    localStorage.setItem('discoverView', v);
  };

  const handleTypeChange = (tf) => {
    setTypeFilter(tf);
    if(activeFilter==='in_orbit'&&tf!=='Pals')setActiveFilter('for_you');
    
  };

  const clearFilters = () => {
    clearDiscoveryState(user?.id);
    setSaved({view:'cards',search:'',activeFilter:'for_you',typeFilter:'All',advancedFilters:null,peopleFilters:{}});
    setSearchParams({}, {replace:true});setShowFilters(false);localStorage.removeItem('discoverView');
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

  // The server list is created_at.desc. Keep that order for the Newest gallery;
  // quick/advanced filters only remove records and never fabricate recency.
  const getFilteredExperiences = () => MAIN_SEARCH_CONTRACT ? experiences : applyAdvancedFilters(applyQuickFilter(experiences)) || [];

  const getSearchResults = () => {
    const expResults = searchDiscoveryRows(applyAdvancedFilters(applyQuickFilter(experiences)), 'experiences', searchQuery).map(e => ({ ...e, type: 'experience' }));
    if (typeFilter === 'Experiences') return expResults;
    const circleResults = searchDiscoveryRows(allCircles, 'circles', searchQuery).map(c => ({ ...c, type: 'circle' }));
    if (typeFilter === 'Circles') return circleResults;
    const communityResults = searchDiscoveryRows(allCommunities, 'communities', searchQuery).map(c => ({ ...c, type: 'community' }));
    if (typeFilter === 'Communities') return communityResults;
    const peopleResults = searchDiscoveryRows(allPeople, 'people', searchQuery).map(person => ({ ...person, type: 'pal' }));
    return [...peopleResults, ...expResults, ...circleResults, ...communityResults];
  };

  const getMapExperiences = () => applyAdvancedFilters(applyQuickFilter(experiences));

  const isBrowsing = !search && activeFilter === 'for_you' && !advancedFilters;

  const activeCommunities = [...allCommunities].sort((a, b) => (b.member_count || 0) - (a.member_count || 0)).slice(0, 10);
  const newCommunities = [...allCommunities].sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0)).slice(0, 10);
  const popularCommunities = [...allCommunities].sort((a, b) => (b.member_count || 0) - (a.member_count || 0)).slice(0, 10);
  const recommendedCircles = allCircles.filter((c) => (c.tags || []).includes('recommended') || (c.tags || []).includes('nearby'));

  const renderAllPeople = () => (
    <section aria-label="Pals" className="space-y-3">
      {allPeople.length > 0 && <h2 className="text-lg font-semibold">{t('discovery.type.pals')}</h2>}
      {peopleError && <p role="status">Pals could not be loaded. <button type="button" className="text-primary" onClick={() => retryPeople()}>Try again</button></p>}
      <div className="discovery-grid">{allPeople.map(person => <PersonResult key={person.id} person={person} />)}</div>
    </section>
  );
  const hasAllSupplement = allPeople.length > 0 || allCircles.length > 0 || allCommunities.length > 0 || peopleError;
  const renderAllSupplement = () => <div className="space-y-8">
    {renderAllPeople()}
    {allCircles.length > 0 && <section aria-label="Circles" className="discovery-grid">
      {allCircles.map(circle => <CircleCard key={circle.id} circle={circle} />)}
    </section>}
    {allCommunities.length > 0 && <CommunitySection title={t('discovery.section.all_communities')} communities={allCommunities} />}
  </div>;

  const galleryItems = useMemo(() => {
    const people = allPeople.map(item => ({ ...item, type: 'person' }));
    const experiencesForGallery = getFilteredExperiences().map(item => ({ ...item, type: 'experience' }));
    const circles = allCircles.map(item => ({ ...item, type: 'circle' }));
    if (typeFilter === 'Pals') return people;
    if (typeFilter === 'Experiences') return experiencesForGallery;
    if (typeFilter === 'Circles') return circles;
    return [...people, ...experiencesForGallery, ...circles,...(MAIN_SEARCH_CONTRACT?mainPosts.rows.map(p=>({...p,type:'post'})):[])];
  }, [allPeople, allCircles, experiences, typeFilter, activeFilter, advancedFilters,mainPosts.rows]);
  const gallerySearchResults = useMemo(() => {
    if (MAIN_SEARCH_CONTRACT) return discoveryQuickResults(galleryItems,activeFilter);
    if (!searchQuery) return galleryItems;
    return galleryItems.filter(item => searchDiscoveryRows([item], item.type === 'person' ? 'people' : `${item.type}s`, searchQuery).length > 0);
  }, [galleryItems, searchQuery, activeFilter]);

  const renderContent = () => {
    if (typeFilter === 'Nmood shares') return searchPending ? <p role="status">Updating search results…</p> : <NmoodsHomeSection fullList mode={activeFilter} query={searchQuery} filters={MAIN_SEARCH_CONTRACT?filtersForKind('posts',advancedFilters):{}} />;
    if (typeFilter === 'Pals') return <PalsExploreSection query={searchQuery} searchPending={searchPending} onClearSearch={() => setSearch('')} categories={advancedFilters?.category||advancedFilters?.categories||[]} filters={{...filtersForKind('people',advancedFilters),...peopleFilters}} onFiltersChange={setPeopleFilters} onReset={clearFilters} mode={activeFilter} />;
    if (searchPending) return <p role="status">Updating search results…</p>;
    if ((typeFilter === 'All' && (circlesError || expError || peopleError || mainPosts.isError)) || (typeFilter === 'Circles' && circlesError) || (typeFilter === 'Experiences' && expError)) {
      return <DiscoveryStatus label={typeFilter === 'All' ? 'Discovery' : typeFilter} error onRetry={() => Promise.all([retryCircles(), retryExperiences(), retryPeople()])} />;
    }

    if ((typeFilter === 'Circles' && circlesLoading) || (typeFilter === 'Experiences' && expLoading) || (typeFilter === 'All' && (expLoading || peopleLoading || communitiesLoading || circlesLoading || mainPosts.loading))) {
      return <DiscoverSkeleton />;
    }
    if (error) {
      return <DiscoverError onRetry={handleRetry} />;
    }
    if (view !== 'map') {
      if (gallerySearchResults.length === 0) return <DiscoverEmptyState title={searchQuery ? `No ${typeFilter === 'All' ? 'results' : typeFilter.toLowerCase()} match ‘${search.trim()}’` : 'No eligible results yet'} description={searchQuery ? 'Try another search or clear the text.' : 'Results appear here when there is active, authorized content.'} actionLabel="Reset filters" onAction={clearFilters} />;
      return <DiscoveryGallery key={`${typeFilter}-${searchQuery}`} items={gallerySearchResults} viewer={member} peopleOnly={typeFilter === 'Pals'} />;
    }
    if (!searchQuery && view === 'map' && ['All', 'Experiences'].includes(typeFilter)) {
      return <div className="space-y-8"><MapView experiences={getMapExperiences()} />{typeFilter === 'All' && renderAllSupplement()}</div>;
    }


    if (searchQuery) {
      const results = getSearchResults();
      if (results.length === 0) {
        if (typeFilter === 'All' && peopleError) return <DiscoverError onRetry={() => retryPeople()} />;
        return (
          <DiscoverEmptyState
            title={`No ${typeFilter === 'All' ? 'results' : typeFilter.toLowerCase()} match ‘${search.trim()}’`}
            description="Try another search or clear the text."
            actionLabel="Clear search"
            onAction={() => setSearch('')}
          />
        );
      }
      return (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{t('discovery.results_found', { count: results.length })}</p>
          <div className="discovery-grid">{results.map((item) => item.type === 'pal' ? <PersonResult key={`pal-${item.id}`} person={item} /> : <SearchResultCard key={`${item.type}-${item.id}`} item={item} />)}</div>
        </div>
      );
    }

    if (!isBrowsing) {
      if (typeFilter === 'Pals') {
        return <PalsExploreSection query={searchQuery} searchPending={searchPending} onClearSearch={() => setSearch('')} categories={advancedFilters?.category||advancedFilters?.categories||[]} filters={{...filtersForKind('people',advancedFilters),...peopleFilters}} onFiltersChange={setPeopleFilters} onReset={clearFilters} mode={activeFilter} />;
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
          <div className="discovery-grid">
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
      if (filteredExperiences.length === 0 && !(typeFilter === 'All' && hasAllSupplement)) {
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
        <div className="space-y-8">
          {typeFilter === 'All' && renderAllSupplement()}
          <div className="discovery-grid">
            {filteredExperiences.map((exp) => <DiscoverCard key={exp.id} experience={exp} />)}
          </div>
        </div>
      );
    }

    if (experiences.length === 0 && ['All', 'Experiences'].includes(typeFilter)) {
      if (typeFilter === 'All' && hasAllSupplement) return renderAllSupplement();
      return (
        <div className="space-y-14">
          <DiscoverSectionReveal><ConciergeEntryCard /></DiscoverSectionReveal>
          <DiscoverEmptyState
            title={t('discovery.empty.no_adventures.title')}
            description={t('discovery.empty.no_adventures.desc')}
            actionLabel={t('discovery.empty.no_adventures.cta')}
            onAction={() => navigate('/search', { state: originState() })}
          />
        </div>
      );
    }

    return (
      <div className="space-y-14">
        {typeFilter === 'All' && renderAllPeople()}
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
      <ExplorerScopeNotice />
      <ExploreHero
        title={t('discovery.title')}
        subtitle={t('discovery.subtitle')}
        search={search}
        onSearchChange={(e) => setSearch(e.target.value)}
        view={view}
        onViewChange={handleViewChange}
        onOpenFilters={() => setShowFilters(true)}
        activeChip={activeFilter}
        onChipChange={(chip) => {setActiveFilter(chip);if(chip==='in_orbit')setTypeFilter('Pals');}}
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
              aria-pressed={typeFilter === tf}
              onClick={() => handleTypeChange(tf)}
              type="button"
              className={`nmood-discover-category px-4 py-2 rounded-full text-sm font-medium flex-shrink-0 transition-default border snap-start ${
                typeFilter === tf
                  ? 'bg-nmood-cta text-white border-transparent shadow-sm shadow-primary/25'
                  : 'bg-card text-muted-foreground border-border hover:border-primary/30'
              }`}
            >
              {tf === 'Pals' ? 'People' : tf === 'Nmood shares' ? 'Nmood Shares' : t(TYPE_LABEL_KEYS[tf])}
            </button>
          ))}
        </div>

        {/* Content */}
        <UpgradeMembershipCTA source="discover" className="mb-4" />
        {discoveryModeDescription(activeFilter)&&<p className="mb-3 text-sm text-muted-foreground">{discoveryModeDescription(activeFilter)}</p>}
        <button type="button" className="min-h-11 rounded-xl border px-4 text-sm" onClick={clearFilters}>Clear all</button>
        {renderContent()}
        {MAIN_SEARCH_CONTRACT && typeFilter!=='Pals' && [mainPeople,mainCircles,mainExperiences,mainPosts].some(x=>x?.hasNextPage) && <button className="min-h-11 text-primary" onClick={()=>Promise.all([mainPeople,mainCircles,mainExperiences,mainPosts].filter(x=>x?.hasNextPage).map(x=>x.fetchNextPage()))}>Load more</button>}
      </motion.div>

      <FilterSheet
        open={showFilters}
        onOpenChange={setShowFilters}
        onApply={typeFilter==='Pals'?setPeopleFilters:setAdvancedFilters}
        onReset={clearFilters}
        type={typeFilter}
        initialFilters={typeFilter==='Pals'?{...advancedFilters,...peopleFilters}:advancedFilters}
      />

      {/* Persistent Host FAB — flex-shrink-0 footer above MobileNav */}
      <div className="sticky bottom-0 flex-shrink-0 flex justify-end px-4 pt-3 pb-3 bg-background border-t border-border/50 z-30">
        <button
          onClick={() => navigate('/host/create', { state: originState() })}
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
export default function Explore(props) { return <LegacyExplore {...props}/>; }
