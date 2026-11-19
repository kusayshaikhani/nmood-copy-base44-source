import ContractSearch from '@/components/discover/ContractSearch';
import { MAIN_PASSPORT } from '@/lib/passport/enabled';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Users, X } from 'lucide-react';
import CircleGridCard from '@/components/communities/CircleGridCard';
import CircleFilterSheet from '@/components/communities/CircleFilterSheet';
import EmptyState from '@/components/shared/EmptyState';
import { useMergedCircles } from '@/lib/circle-store';
import { deriveCommunityCategories } from '@/lib/communities-live';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { useOriginState } from '@/lib/safe-navigation';
import UpgradeMembershipCTA from '@/components/membership/UpgradeMembershipCTA';

/**
 * Circles discovery screen.
 * Compact gradient header, then the standard Nmood card surface so body text
 * uses the default readable foreground colours. Two-column card grid.
 */
const sortOptions = [
  { id: 'Popular', key: 'community.page.sort_popular' },
  { id: 'Active', key: 'community.page.sort_active' },
  { id: 'Nearby', key: 'community.page.sort_nearby' },
  { id: 'New', key: 'community.page.sort_new' },
];

function LegacyCommunities() {
  const navigate = useNavigate();
  const originState = useOriginState();
  const { t } = useLocalization();
  // Real Supabase-backed circles only — same source Home's Popular Circles
  // section already uses. No demo/fixture fallback.
  const circles = useMergedCircles();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sortBy, setSortBy] = useState('Popular');
  const [filterOpen, setFilterOpen] = useState(false);

  const categories = deriveCommunityCategories(circles);

  const q = search.trim().toLowerCase();
  const filtered = circles.filter((c) => {
    const matchesSearch = !q ||
      (c.name || '').toLowerCase().includes(q) ||
      (c.description || '').toLowerCase().includes(q) ||
      (c.category || '').toLowerCase().includes(q) ||
      (c.location || '').toLowerCase().includes(q);
    const matchesCategory = category === 'All' || c.category === category;
    return matchesSearch && matchesCategory;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'Popular') return (b.member_count || 0) - (a.member_count || 0);
    if (sortBy === 'Active') return (b.member_count || 0) - (a.member_count || 0);
    if (sortBy === 'New') return new Date(b.created_date || 0) - new Date(a.created_date || 0);
    return 0;
  });

  const hasActiveFilters = search !== '' || category !== 'All' || sortBy !== 'Popular';
  const hasSearch = q !== '';
  const hasAnyCircles = circles.length > 0;
  const showNoMatches = hasAnyCircles && sorted.length === 0;
  const showEmpty = !hasAnyCircles && !hasSearch;

  return (
    <div className="min-h-full w-full max-w-full overflow-x-clip bg-background flex flex-col">
      {/* Standard Nmood page treatment: compact gradient header, then the
          normal card surface with default foreground colours. The previous
          full-screen purple wash made body text low-contrast and made this
          screen look unlike every other page. */}
      <div className="relative bg-nmood-gradient px-4 pt-[calc(3.5rem+env(safe-area-inset-top))] pb-10 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="nmood-glow -top-16 -right-12 w-48 h-48 bg-white/20" />
          <div className="nmood-glow top-12 -left-16 w-44 h-44 bg-indigo-300/30" />
        </div>

        <div className="relative max-w-md mx-auto sm:max-w-2xl md:max-w-4xl">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-[28px] font-bold text-white leading-tight tracking-tight">
                {t('community.page.title')}
              </h1>
              <p className="text-[13px] text-white/75 font-medium mt-0.5 leading-snug">
                {t('community.page.subtitle')}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setFilterOpen(true)}
                className="relative w-11 h-11 rounded-full bg-white/15 border border-white/25 flex items-center justify-center active:scale-95 transition-transform touch-target"
                aria-label="Search and filter circles"
              >
                <Search className="w-5 h-5 text-white" />
                {hasActiveFilters && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-white" />
                )}
              </button>
              <button
                onClick={() => navigate('/host/create-circle', { state: originState() })}
                className="w-11 h-11 rounded-full bg-white/20 border border-white/30 flex items-center justify-center active:scale-95 transition-transform touch-target"
                aria-label="Create a circle"
              >
                <Plus className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          <div className="relative mt-4">
            <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/70 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search circles and interests"
              className="w-full h-12 ps-11 pe-10 rounded-2xl bg-white/15 backdrop-blur-xl border border-white/30 text-sm font-medium text-white placeholder:text-white/70 focus:outline-none focus:border-white/60 focus:ring-2 focus:ring-white/25 transition-[border-color,box-shadow] duration-200"
              aria-label="Search circles"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute end-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/15 flex items-center justify-center active:scale-90 transition-transform"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5 text-white" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="relative -mt-6 rounded-t-[32px] bg-card px-4 pt-6 pb-32 flex-1">
        <div className="max-w-md mx-auto sm:max-w-2xl md:max-w-4xl space-y-5">
          <UpgradeMembershipCTA source="circles" />

          {showNoMatches ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Search className="w-10 h-10 text-muted-foreground/40 mb-3" />
              <p className="font-medium text-sm">No matching circles</p>
              <p className="text-muted-foreground text-xs mt-1">Try a different search term</p>
              <button
                onClick={() => setSearch('')}
                className="mt-4 px-4 h-10 rounded-full border border-border text-sm font-medium active:scale-95 transition-transform"
              >
                Clear search
              </button>
            </div>
          ) : showEmpty ? (
            <EmptyState
              icon={Users}
              title="No circles yet"
              description="Be the first to start a circle, or explore what's happening on Nmood."
              actionLabel="Create a circle"
              onAction={() => navigate('/host/create-circle', { state: originState() })}
              secondaryLabel="Explore"
              onSecondary={() => navigate('/explore')}
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {sorted.map((c, i) => (
                <CircleGridCard key={c.id} community={c} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>

      <CircleFilterSheet
        open={filterOpen}
        onOpenChange={setFilterOpen}
        search={search}
        setSearch={setSearch}
        category={category}
        setCategory={setCategory}
        sortBy={sortBy}
        setSortBy={setSortBy}
        categories={categories}
        sortOptions={sortOptions}
        t={t}
      />
    </div>
  );
}
export default function Communities(){ return MAIN_PASSPORT ? <ContractSearch initialKind="circles"/> : <LegacyCommunities/>; }
