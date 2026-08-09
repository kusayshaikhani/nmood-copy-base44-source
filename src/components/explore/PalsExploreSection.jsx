import React, { useState, useMemo } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
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
 * looking-for, distance, interests, languages, zodiac).
 */
export default function PalsExploreSection() {
  const { member } = useAuth();
  const { isBlocked } = useSafety();
  const { members, loading } = useSearchPeople();
  const { t } = useLocalization();
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({});
  const [locationOverride, setLocationOverride] = useState(null);

  const memberLocation = useMemo(() => {
    if (locationOverride) return locationOverride;
    if (typeof member?.latitude === 'number' && typeof member?.longitude === 'number') {
      return { lat: member.latitude, lng: member.longitude };
    }
    return null;
  }, [member, locationOverride]);

  const results = useMemo(() => {
    let r = members.filter((p) => !isBlocked(p.id));
    // Gender
    if (filters.gender?.length) {
      const genderMap = { men: 'male', women: 'female' };
      const targetGenders = filters.gender.map((g) => genderMap[g]).filter(Boolean);
      if (targetGenders.length) r = r.filter((p) => targetGenders.includes(p.gender));
    }
    // Age
    const ageMin = filters.age_min != null ? filters.age_min : 18;
    const ageMax = filters.age_max != null ? filters.age_max : 99;
    if (ageMin !== 18 || ageMax !== 99) {
      r = r.filter((p) => p.age != null && p.age >= ageMin && p.age <= ageMax);
    }
    // Looking for
    if (filters.looking_for?.length) {
      r = r.filter((p) => (p.looking_for_tags || []).some((tag) => filters.looking_for.includes(tag)));
    }
    // Languages
    if (filters.languages?.length) {
      r = r.filter((p) => (p.languages || []).some((lang) => filters.languages.some((f) => lang.toLowerCase().includes(f.toLowerCase()))));
    }
    // Zodiac
    if (filters.zodiac?.length) {
      r = r.filter((p) => filters.zodiac.includes(p.zodiac));
    }
    // Interests
    if (filters.interests?.length) {
      r = r.filter((p) => (p.interests || []).some((i) => filters.interests.includes(i)));
    }
    // Pals distance
    if (filters.pals_distance?.length && memberLocation) {
      const maxDist = Math.max(...filters.pals_distance.map(Number));
      r = r.filter((p) => {
        const d = haversineKm(memberLocation.lat, memberLocation.lng, p.latitude, p.longitude);
        return d != null && d <= maxDist;
      });
    }
    return r;
  }, [members, filters, isBlocked, memberLocation]);

  const activeFilterCount = Object.values(filters).reduce((sum, arr) => sum + (arr?.length || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {loading ? t('search.loading') : t('search.results_count', { count: results.length })}
        </p>
        <button
          type="button"
          onClick={() => setShowFilters(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-sm font-medium transition-default hover:border-primary/30 relative"
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

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl border border-border bg-card shimmer" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <EmptyState
          icon={Users}
          title={t('search.empty_pals_title')}
          description={t('search.empty_pals_desc')}
        />
      ) : (
        <div className="space-y-2">
          {results.map((p) => <PersonResult key={p.id} person={p} />)}
        </div>
      )}

      <UnifiedSearchFilters
        tab="pals"
        open={showFilters}
        onOpenChange={setShowFilters}
        filters={filters}
        onApply={setFilters}
        memberLocation={memberLocation}
        onLocationGranted={setLocationOverride}
      />
    </div>
  );
}

// Haversine distance in km — mirrors src/lib/distance-utils.js inline to
// avoid a circular import in this standalone section component.
function haversineKm(lat1, lng1, lat2, lng2) {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return null;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}