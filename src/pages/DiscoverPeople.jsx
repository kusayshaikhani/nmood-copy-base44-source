import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSafeBack } from '@/lib/safe-navigation';
import { motion } from 'framer-motion';
import { Sparkles, Compass, Heart, UserCircle, WifiOff, Shield, X, SlidersHorizontal, Search } from 'lucide-react';
import DiscoverHero from '@/components/discover-people/DiscoverHero';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import MemberDiscoveryCard from '@/components/matchmaker/MemberDiscoveryCard';
import MatchmakerFilters from '@/components/matchmaker/MatchmakerFilters';
import { fetchRecommendations, privacyDefaults, buildMatchProfile, buildDynamicFilterOptions } from '@/lib/matchmaker-data';
import { useAuth } from '@/lib/AuthContext';
import { useSafety } from '@/lib/safety-store';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { useDiscoveryFilters } from '@/hooks/useDiscoveryFilters';
import { lookingForTagLabel, zodiacLabel } from '@/lib/looking-for-tags';
import { useOnlineStatus } from '@/lib/useOnlineStatus';
import { getProfileCompleteness } from '@/lib/profile-completeness';

/**
 * UI-005 — Premium Discovery (People) page.
 * Large gradient hero with interactive mood cards → rounded white content
 * container with AI recommendations. All filter / privacy / recommendation /
 * offline / loading / empty logic preserved exactly.
 */
export default function DiscoverPeople() {
  const navigate = useNavigate();
  const handleBack = useSafeBack('/explore');
  const { filters, setFilters, privacy, setPrivacy, clearFilters } = useDiscoveryFilters({}, privacyDefaults);
  const [showFilters, setShowFilters] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { member, user } = useAuth();
  const { blockedIds } = useSafety();
  const { t } = useLocalization();
  const isOnline = useOnlineStatus();

  const [recommendations, setRecommendations] = useState([]);
  const [recsLoading, setRecsLoading] = useState(true);

  // Long-term search preferences from the user's profile (Settings → Search
  // preferences). These form the discovery baseline; momentary session
  // filters (from the filter sheet) layer on top as overrides. Availability
  // is intentionally not passed here — the matchmaker has no member
  // availability data yet, so passing it would exclude everyone.
  const baseFilters = useMemo(() => {
    const f = {};
    if (member?.discovery_scope === 'same_country' && member?.search_country) {
      f.country = member.search_country;
    } else if (member?.discovery_scope === 'nearby' && member?.city) {
      f.city = member.city;
    }
    if (Array.isArray(member?.search_languages) && member.search_languages.length) f.language = member.search_languages[0];
    return f;
  }, [member]);

  const effectiveFilters = useMemo(() => {
    const f = { ...baseFilters, ...filters };
    // Distance filter from the sheet overrides baseFilters city/country.
    if (filters.distance === 'nearby') {
      if (member?.city) f.city = member.city;
      delete f.country;
    } else if (filters.distance === 'same_country') {
      if (member?.country_code) f.country = member.country_code;
      else if (member?.country) f.country = member.country;
      delete f.city;
    } else if (filters.distance === 'anywhere') {
      delete f.city;
      delete f.country;
    }
    return f;
  }, [baseFilters, filters, member]);

  useEffect(() => {
    const userProfile = buildMatchProfile(member);
    if (!userProfile) { setRecommendations([]); setRecsLoading(false); return; }
    let active = true;
    setRecsLoading(true);
    const currentUserId = member?.id || user?.id;
    const currentUserEmail = member?.email || user?.email;
    const exclusions = { currentUserId, currentUserEmail, blockedIds: [...(blockedIds || [])], palIds: [] };
    fetchRecommendations(userProfile, effectiveFilters, privacy, exclusions)
      .then((recs) => { if (active) { setRecommendations(recs); setRecsLoading(false); } })
      .catch(() => { if (active) { setRecommendations([]); setRecsLoading(false); } });
    return () => { active = false; };
  }, [member, user, effectiveFilters, privacy, blockedIds]);

  const activeFilterCount = useMemo(
    () => Object.values(filters).reduce((sum, v) => sum + (Array.isArray(v) ? v.length : v ? 1 : 0), 0),
    [filters]
  );
  const loading = !member || recsLoading;

  // Dynamic filter suggestions derived from real recommendation data —
  // cities & languages members actually have, with seeded fallback handled
  // inside buildDynamicFilterOptions.
  const dynamicFilterOptions = useMemo(() => buildDynamicFilterOptions(recommendations), [recommendations]);

  // Only show optional filter groups that have data in the current results.
  const hasLookingFor = recommendations.some((r) => (r.looking_for_tags || []).length > 0);
  const hasZodiac = recommendations.some((r) => r.zodiac);

  // Client-side text search on the already-fetched, name-resolved results.
  // Searches public fields only: name, bio, city, interests.
  const filteredRecommendations = useMemo(() => {
    if (!searchQuery.trim()) return recommendations;
    const q = searchQuery.toLowerCase().trim();
    return recommendations.filter((m) => {
      const name = (m.name || '').toLowerCase();
      const bio = (m.bio || '').toLowerCase();
      const city = (m.city || '').toLowerCase();
      const interests = (m.interests || []).join(' ').toLowerCase();
      return name.includes(q) || bio.includes(q) || city.includes(q) || interests.includes(q);
    });
  }, [recommendations, searchQuery]);

  // Build per-item removable chips for active filters (arrays expand to
  // one chip per selected value; single-value filters produce one chip).
  const filterChips = useMemo(() => {
    const chips = [];
    const labelFn = {
      interests: (v) => v,
      looking_for: (v) => lookingForTagLabel(t, v),
      languages: (v) => v,
      zodiac: (v) => zodiacLabel(t, v),
      distance: (v) => t(`discovery.filters.distance.${v}`),
      goals: (v) => v,
      circles: (v) => v,
    };
    for (const [key, value] of Object.entries(filters)) {
      if (Array.isArray(value)) {
        value.forEach((item) => chips.push({ key, item, label: (labelFn[key] || ((v) => v))(item) }));
      } else if (value) {
        chips.push({ key, item: null, label: (labelFn[key] || ((v) => v))(value) });
      }
    }
    return chips;
  }, [filters, t]);

  const removeFilterItem = useCallback((key, item) => {
    setFilters((prev) => {
      if (Array.isArray(prev[key])) {
        return { ...prev, [key]: prev[key].filter((v) => v !== item) };
      }
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, [setFilters]);

  const onMoodToggle = (value) => {
    setFilters((prev) => ({ ...prev, interest: prev.interest === value ? null : value }));
  };

  // BUG-010 — Contextual empty-state guidance, not just "No results".
  // Each hint appears only when relevant to the current user's state, so a
  // fully-complete profile never sees a "complete your profile" nudge.
  const completeness = getProfileCompleteness(member, user);
  const profileComplete = completeness.pct >= 100;
  const hasLocationNarrowing = Boolean(baseFilters.city || baseFilters.country || filters.city || filters.country);
  const hasActiveFilters = activeFilterCount > 0 || Boolean(searchQuery.trim());
  // Only suggest adding interests when the profile is already complete but
  // interests are genuinely sparse for matching (fewer than 5). When the
  // profile is incomplete, the "complete your profile" hint covers it — so
  // the two never appear together.
  const interestsSparse = profileComplete && (member?.interests?.length || 0) < 5;
  const emptyHints = [
    hasActiveFilters && { icon: SlidersHorizontal, label: t('discovery.empty.hint_filters') },
    hasLocationNarrowing && { icon: Compass, label: t('discovery.empty.hint_distance') },
    interestsSparse && { icon: Heart, label: t('discovery.empty.hint_interests') },
    !profileComplete && { icon: UserCircle, label: t('discovery.empty.hint_profile') },
  ].filter(Boolean);

  return (
    <div className="bg-background min-h-screen flex flex-col">
      <DiscoverHero
        title={t('discovery.members.title')}
        subtitle={t('discovery.members.subtitle')}
        onBack={handleBack}
        onOpenFilters={() => setShowFilters(true)}
        activeFilterCount={activeFilterCount}
        onOpenPrivacy={() => setShowPrivacy(true)}
        activeInterest={filters.interest}
        onMoodToggle={onMoodToggle}
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="relative -mt-8 rounded-t-[32px] bg-card px-6 pt-6 pb-28 flex-1 space-y-6"
      >
        {/* Active filter chips */}
        {/* Text search — searches public fields only (name, bio, city, interests) */}
        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('discovery.search.placeholder')}
            className="w-full h-12 pl-10 pr-10 rounded-input bg-secondary/60 border border-border/50 text-sm font-medium text-foreground outline-none focus:border-primary/40 focus:bg-card transition-default"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Active filter chips + clear all */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {filterChips.map((chip) => (
              <button
                key={`${chip.key}-${chip.item || ''}`}
                type="button"
                onClick={() => removeFilterItem(chip.key, chip.item)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium transition-default hover:bg-primary/15"
              >
                {chip.label}
                <X className="w-3 h-3 text-primary/60" />
              </button>
            ))}
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-medium text-muted-foreground underline ml-1"
            >
              {t('discovery.filters.clear_all')}
            </button>
          </div>
        )}

        {/* AI recommendations heading */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold leading-tight">{t('discovery.members.title')}</h2>
            <p className="text-xs text-muted-foreground">{t('discovery.members.subtitle')}</p>
          </div>
        </div>

        {/* BUG-009 — Offline state */}
        {!isOnline && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-card bg-muted flex items-center justify-center mb-4">
              <WifiOff className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="font-medium text-sm mb-1">{t('discovery.offline.title')}</p>
            <p className="text-xs text-muted-foreground mb-4 max-w-xs">{t('discovery.offline.desc')}</p>
          </div>
        )}

        {/* Loading skeleton */}
        {isOnline && loading && (
          <div className="grid gap-5 sm:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="rounded-card border border-border/40 bg-card p-5">
                <div className="flex items-start gap-3 mb-3">
                  <Skeleton className="w-16 h-16 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-9 w-full rounded-button" />
              </div>
            ))}
          </div>
        )}

        {/* Privacy-off state */}
        {isOnline && !loading && !privacy.peopleRecommendations ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-card bg-muted flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="font-medium text-sm mb-1">{t('discovery.members.reco_off.title')}</p>
            <p className="text-xs text-muted-foreground mb-4 max-w-xs">{t('discovery.members.reco_off.desc')}</p>
            <Button size="sm" onClick={() => setPrivacy((prev) => ({ ...prev, peopleRecommendations: true }))}>
              {t('discovery.members.reco_off.enable')}
            </Button>
          </div>
        ) : filteredRecommendations.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2">
            {filteredRecommendations.map((m, i) => (
              <MemberDiscoveryCard key={m.id} member={m} index={i} />
            ))}
          </div>
        ) : (
          !loading && isOnline && (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className="relative mb-5">
                <div className="nmood-empty-glow absolute inset-0 rounded-full bg-primary/20 blur-2xl" aria-hidden="true" />
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-primary/12 to-accent/18 flex items-center justify-center ring-1 ring-primary/10">
                  <Sparkles className="w-8 h-8 text-primary/80" strokeWidth={1.6} />
                </div>
              </div>
              <h3 className="text-base font-semibold text-foreground mb-1.5 max-w-xs text-balance">
                {hasActiveFilters
                  ? t('discovery.members.no_matches.title')
                  : t('discovery.members.no_matches.title_plain')}
              </h3>
              <p className="text-sm text-muted-foreground mb-5 max-w-xs leading-relaxed">
                {hasActiveFilters
                  ? t('discovery.members.no_matches.desc')
                  : t('discovery.members.no_matches.desc_plain')}
              </p>
              {/* Contextual guidance — only suggestions relevant to the current state */}
              {emptyHints.length > 0 && (
                <div className="flex flex-col gap-2 mb-5 max-w-xs w-full">
                  {emptyHints.map((hint) => {
                    const Icon = hint.icon;
                    return (
                      <div key={hint.label} className="flex items-center gap-2.5 text-[13px] text-muted-foreground px-3.5 py-2.5 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-primary/[0.08] text-primary">
                          <Icon className="w-3.5 h-3.5" />
                        </span>
                        <span className="text-left leading-snug">{hint.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              {hasActiveFilters && (
                <Button size="sm" variant="outline" onClick={() => { clearFilters(); setSearchQuery(''); }}>
                  {t('discovery.members.clear_filters')}
                </Button>
              )}
            </div>
          )
        )}
      </motion.div>

      <MatchmakerFilters
        open={showFilters}
        onOpenChange={setShowFilters}
        filters={filters}
        onApply={setFilters}
        hasLookingFor={hasLookingFor}
        hasZodiac={hasZodiac}
      />

      {showPrivacy && (
        <PrivacySheet open={showPrivacy} onOpenChange={setShowPrivacy} privacy={privacy} setPrivacy={setPrivacy} />
      )}
    </div>
  );
}

function PrivacySheet({ open, onOpenChange, privacy, setPrivacy }) {
  const { t } = useLocalization();
  const toggles = [
    { key: 'peopleRecommendations', labelKey: 'discovery.privacy.people_reco.label', descKey: 'discovery.privacy.people_reco.desc' },
    { key: 'discoveryVisibility', labelKey: 'discovery.privacy.visibility.label', descKey: 'discovery.privacy.visibility.desc' },
    { key: 'locationMatching', labelKey: 'discovery.privacy.location.label', descKey: 'discovery.privacy.location.desc' },
    { key: 'languageMatching', labelKey: 'discovery.privacy.language.label', descKey: 'discovery.privacy.language.desc' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center bg-black/40" onClick={() => onOpenChange(false)}>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        className="w-full sm:max-w-md max-h-[90vh] overflow-y-auto bg-card rounded-t-dialog sm:rounded-dialog p-5 pb-[calc(env(safe-area-inset-bottom)+96px)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto w-10 h-1 rounded-full bg-muted mb-4" />
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-1">
          <Shield className="w-4 h-4 text-primary" /> {t('discovery.privacy.title')}
        </h2>
        <p className="text-xs text-muted-foreground mb-4">{t('discovery.privacy.desc')}</p>

        <div className="space-y-3">
          {toggles.map((toggle) => (
            <div key={toggle.key} className="flex items-start justify-between gap-3 p-3 rounded-xl border border-border/40">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{t(toggle.labelKey)}</p>
                <p className="text-xs text-muted-foreground">{t(toggle.descKey)}</p>
              </div>
              <Switch
                checked={privacy[toggle.key]}
                onCheckedChange={(checked) => setPrivacy((prev) => ({ ...prev, [toggle.key]: checked }))}
              />
            </div>
          ))}
        </div>

        <Button variant="ghost" className="w-full mt-4" onClick={() => onOpenChange(false)}>
          {t('common.done')}
        </Button>
      </motion.div>
    </div>
  );
}