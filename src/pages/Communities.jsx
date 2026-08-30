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
 * Immersive dark Circles discovery screen.
 * Compact header with title, subtitle, and circular + button.
 * Two-column image grid. Search/filter in expandable bottom sheet.
 */
const sortOptions = [
  { id: 'Popular', key: 'community.page.sort_popular' },
  { id: 'Active', key: 'community.page.sort_active' },
  { id: 'Nearby', key: 'community.page.sort_nearby' },
  { id: 'New', key: 'community.page.sort_new' },
];

export default function Communities() {
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
    <div className="min-h-screen relative bg-background flex flex-col">
      {/* Fixed bright safe-area strip — pinned to the viewport top so it stays
          above the scrolling Circles content. Android status-bar icons always
          sit over a bright surface instead of the dark purple gradient.
          z-[5] covers the dark gradient/glow beneath; #F7F7FD stays bright in
          both themes. The in-flow spacer below reserves the same height so the
          gradient/title start below it (no second gap, title not hidden). */}
      <div className="fixed top-0 left-0 right-0 z-[5] h-[max(env(safe-area-inset-top,0px),28px)] bg-[#F7F7FD]" />
      <div className="h-[max(env(safe-area-inset-top,0px),28px)] flex-shrink-0" />

      <div
        className="flex-1 relative"
        style={{
          background:
            '#2D1B69 linear-gradient(160deg, #1A0B3E 0%, #2D1B69 25%, #4B2A9E 55%, #6A35FF 100%)',
        }}
      >
      {/* Purple glow accents */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 50% 35% at 15% 5%, rgba(91, 61, 245, 0.22) 0%, transparent 55%), radial-gradient(ellipse 40% 30% at 85% 0%, rgba(139, 92, 246, 0.15) 0%, transparent 50%)',
        }}
      />

      {/* Compact header */}
      <div className="relative px-4 pt-5 pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-[28px] font-bold text-white leading-tight tracking-tight">
              {t('community.page.title')}
            </h1>
            <p className="text-[13px] text-white/50 font-medium mt-0.5 leading-snug max-w-[200px]">
              {t('community.page.subtitle')}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setFilterOpen(true)}
              className="relative w-11 h-11 rounded-full bg-white/10 border border-white/10 flex items-center justify-center active:scale-95 transition-transform touch-target"
              aria-label="Search & Filter"
            >
              <Search className="w-5 h-5 text-white" />
              {hasActiveFilters && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
              )}
            </button>
            <button
              onClick={() => navigate('/host/create-circle', { state: originState() })}
              className="w-11 h-11 rounded-full bg-primary flex items-center justify-center active:scale-95 transition-transform shadow-lg shadow-primary/30 touch-target"
              aria-label="Create Circle"
            >
              <Plus className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Full-width search bar */}
      <div className="relative px-4 pb-3">
        <div className="relative max-w-md mx-auto sm:max-w-2xl md:max-w-4xl">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search circles and interests"
            className="nmood-search-hero pl-11 pr-10"
            aria-label="Search circles"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/10 flex items-center justify-center active:scale-90 transition-transform"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5 text-white/60" />
            </button>
          )}
        </div>
      </div>

      {/* Two-column grid */}
      <div className="relative px-4 pb-32">
        <div className="max-w-md mx-auto sm:max-w-2xl md:max-w-4xl">
          <UpgradeMembershipCTA source="circles" className="mb-4" />
        </div>
        <div className="max-w-md mx-auto sm:max-w-2xl md:max-w-4xl">
          {showNoMatches ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Search className="w-10 h-10 text-white/20 mb-3" />
              <p className="text-white/60 font-medium text-sm">No matching circles</p>
              <p className="text-white/40 text-xs mt-1">Try a different search term</p>
              <button
                onClick={() => setSearch('')}
                className="mt-4 px-4 h-10 rounded-full bg-white/10 border border-white/15 text-white/80 text-xs font-medium active:scale-95 transition-transform"
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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
              {sorted.map((c, i) => (
                <CircleGridCard key={c.id} community={c} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filter Sheet */}
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
    </div>
  );
}