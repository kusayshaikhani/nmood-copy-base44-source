import React, { useState, useMemo } from 'react';
import { X, Check, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { categoryLabel } from '@/lib/i18n/label-resolvers';
import { LOOKING_FOR_TAGS, ZODIAC_SIGNS, lookingForTagLabel, zodiacLabel } from '@/lib/looking-for-tags';
import { interests as allInterests, languages as allLanguages } from '@/lib/onboarding-data';
import LocationRequestButton from '@/components/search/LocationRequestButton';

/**
 * Unified search filter sheet — grouped multi-select controls.
 * Within a group: OR (broaden). Across groups: AND (narrow).
 *
 * Props:
 *   tab: 'people' | 'circles' | 'experiences'
 *   open, onOpenChange
 *   filters: { groupKey: [values] }
 *   onApply: (filters) => void
 *   memberLocation: { lat, lng } — for distance filtering
 *   availableCategories: [string] — from real experience/circle data
 */
export default function UnifiedSearchFilters({ tab, open, onOpenChange, filters, onApply, memberLocation, availableCategories, onLocationGranted }) {
  const { t } = useLocalization();
  const [draft, setDraft] = useState(filters || {});
  const [ageMin, setAgeMin] = useState(String(filters?.age_min ?? 18));
  const [ageMax, setAgeMax] = useState(String(filters?.age_max ?? 99));

  // Sync draft when sheet opens
  React.useEffect(() => {
    if (open) {
      setDraft(filters || {});
      setAgeMin(String(filters?.age_min ?? 18));
      setAgeMax(String(filters?.age_max ?? 99));
    }
  }, [open, filters]);

  const toggleValue = (group, value) => {
    setDraft((prev) => {
      const arr = prev[group] || [];
      return { ...prev, [group]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value] };
    });
  };

  // Single-select toggle for groups like gender (Men/Women/Everyone).
  const setSingle = (group, value) => {
    setDraft((prev) => ({ ...prev, [group]: (prev[group] || []).includes(value) ? [] : [value] }));
  };

  const clearAll = () => {
    setDraft({});
    setAgeMin('18');
    setAgeMax('99');
  };

  const handleApply = () => {
    const min = Math.max(18, Math.min(99, Number(ageMin) || 18));
    const max = Math.max(min, Math.min(99, Number(ageMax) || 99));
    onApply({ ...draft, age_min: min, age_max: max });
    onOpenChange(false);
  };

  const ageActive = Number(ageMin) !== 18 || Number(ageMax) !== 99;
  const activeCount = Object.values(draft).reduce((sum, arr) => sum + (arr?.length || 0), 0) + (ageActive ? 1 : 0);

  // Gender options for Pals (single-select). "Everyone" = no filter (clears).
  const GENDER_OPTIONS = [
    { value: 'men', label: t('search.filter.gender_men') },
    { value: 'women', label: t('search.filter.gender_women') },
    { value: 'everyone', label: t('search.filter.gender_everyone') },
  ];

  // Pals distance options (single-select). "Anywhere" = no filter (clears).
  const PALS_DISTANCE_OPTIONS = [
    { value: '5', label: t('search.filter.pals_distance_5') },
    { value: '10', label: t('search.filter.pals_distance_10') },
    { value: '25', label: t('search.filter.pals_distance_25') },
    { value: '50', label: t('search.filter.pals_distance_50') },
    { value: '100', label: t('search.filter.pals_distance_100') },
    { value: '200', label: t('search.filter.pals_distance_200') },
    { value: 'anywhere', label: t('search.filter.pals_distance_anywhere') },
  ];

  // Distance options (km) — uses existing lat/lng, no invasive tracking
  const DISTANCE_OPTIONS = [
    { value: '1', label: t('search.filter.distance_1km') },
    { value: '5', label: t('search.filter.distance_5km') },
    { value: '10', label: t('search.filter.distance_10km') },
    { value: '50', label: t('search.filter.distance_50km') },
  ];

  // Privacy options for Circles
  const PRIVACY_OPTIONS = [
    { value: 'public', label: t('circle.privacy_public') },
    { value: 'approval', label: t('circle.privacy_approval') },
    { value: 'private', label: t('circle.privacy_private') },
  ];

  // Group size options for Circles (based on existing max_members field)
  const GROUP_SIZE_OPTIONS = [
    { value: 'small', label: t('search.filter.group_size_small') },
    { value: 'medium', label: t('search.filter.group_size_medium') },
    { value: 'large', label: t('search.filter.group_size_large') },
  ];

  // Price options for Experiences (based on existing budget field)
  const PRICE_OPTIONS = [
    { value: 'free', label: t('search.filter.price_free') },
    { value: 'paid', label: t('search.filter.price_paid') },
  ];

  // Date/time options for Experiences
  const DATE_OPTIONS = [
    { value: 'today', label: t('search.filter.date_today') },
    { value: 'tomorrow', label: t('search.filter.date_tomorrow') },
    { value: 'weekend', label: t('search.filter.date_weekend') },
    { value: 'week', label: t('search.filter.date_this_week') },
  ];

  // Available spots for Experiences
  const SPOTS_OPTIONS = [
    { value: 'available', label: t('search.filter.spots_available') },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[88dvh] flex flex-col pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto w-10 h-1 rounded-full bg-muted mb-3 flex-shrink-0" />
        <SheetHeader className="flex-shrink-0 mb-3">
          <SheetTitle className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-primary" />
            {t('search.filters_title')}
            {activeCount > 0 && (
              <span className="ml-1 text-xs font-normal text-muted-foreground">({activeCount})</span>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto no-scrollbar space-y-5 pb-4">
          {tab === 'pals' && (
            <>
              <FilterGroup label={t('search.filter.gender')}>
                {GENDER_OPTIONS.map((opt) => (
                  <FilterChip
                    key={opt.value}
                    label={opt.label}
                    selected={opt.value === 'everyone' ? !(draft.gender || []).length : (draft.gender || []).includes(opt.value)}
                    onClick={() => opt.value === 'everyone' ? setDraft((prev) => ({ ...prev, gender: [] })) : setSingle('gender', opt.value)}
                  />
                ))}
              </FilterGroup>

              <FilterGroup label={t('search.filter.age')}>
                <div className="flex items-center gap-2 w-full">
                  <input
                    type="number"
                    min="18"
                    max="99"
                    value={ageMin}
                    onChange={(e) => setAgeMin(e.target.value)}
                    className="flex-1 min-h-[40px] px-3 rounded-full text-sm bg-card border border-border text-foreground focus:border-primary/40 focus:outline-none"
                    aria-label={t('search.filter.age_min')}
                    placeholder="18"
                  />
                  <span className="text-muted-foreground text-sm">–</span>
                  <input
                    type="number"
                    min="18"
                    max="99"
                    value={ageMax}
                    onChange={(e) => setAgeMax(e.target.value)}
                    className="flex-1 min-h-[40px] px-3 rounded-full text-sm bg-card border border-border text-foreground focus:border-primary/40 focus:outline-none"
                    aria-label={t('search.filter.age_max')}
                    placeholder="99"
                  />
                </div>
              </FilterGroup>

              <FilterGroup label={t('search.filter.looking_for')}>
                {LOOKING_FOR_TAGS.map((tag) => (
                  <FilterChip
                    key={tag}
                    label={lookingForTagLabel(t, tag)}
                    selected={(draft.looking_for || []).includes(tag)}
                    onClick={() => toggleValue('looking_for', tag)}
                  />
                ))}
              </FilterGroup>

              <FilterGroup label={t('search.filter.languages')}>
                {allLanguages.slice(0, 20).map((lang) => (
                  <FilterChip
                    key={lang}
                    label={lang}
                    selected={(draft.languages || []).includes(lang)}
                    onClick={() => toggleValue('languages', lang)}
                  />
                ))}
              </FilterGroup>

              <FilterGroup label={t('search.filter.zodiac')}>
                {ZODIAC_SIGNS.map((sign) => (
                  <FilterChip
                    key={sign}
                    label={zodiacLabel(t, sign)}
                    selected={(draft.zodiac || []).includes(sign)}
                    onClick={() => toggleValue('zodiac', sign)}
                  />
                ))}
              </FilterGroup>

              <FilterGroup label={t('search.filter.distance')}>
                {memberLocation ? (
                  PALS_DISTANCE_OPTIONS.map((opt) => (
                    <FilterChip
                      key={opt.value}
                      label={opt.label}
                      selected={opt.value === 'anywhere' ? !(draft.pals_distance || []).length : (draft.pals_distance || []).includes(opt.value)}
                      onClick={() => opt.value === 'anywhere' ? setDraft((prev) => ({ ...prev, pals_distance: [] })) : setSingle('pals_distance', opt.value)}
                    />
                  ))
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">{t('search.filter.distance_requires_location')}</p>
                    <LocationRequestButton onLocationGranted={onLocationGranted} />
                  </div>
                )}
              </FilterGroup>

              <FilterGroup label={t('search.filter.interests')}>
                {allInterests.map((interest) => (
                  <FilterChip
                    key={interest.id}
                    label={categoryLabel(t, interest.id)}
                    selected={(draft.interests || []).includes(interest.id)}
                    onClick={() => toggleValue('interests', interest.id)}
                  />
                ))}
              </FilterGroup>
            </>
          )}

          {tab === 'circles' && (
            <>
              {availableCategories?.length > 0 && (
                <FilterGroup label={t('search.filter.category')}>
                  {availableCategories.map((cat) => (
                    <FilterChip
                      key={cat}
                      label={categoryLabel(t, cat)}
                      selected={(draft.category || []).includes(cat)}
                      onClick={() => toggleValue('category', cat)}
                    />
                  ))}
                </FilterGroup>
              )}

              {memberLocation && (
                <FilterGroup label={t('search.filter.distance')}>
                  {DISTANCE_OPTIONS.map((opt) => (
                    <FilterChip
                      key={opt.value}
                      label={opt.label}
                      selected={(draft.distance || []).includes(opt.value)}
                      onClick={() => toggleValue('distance', opt.value)}
                    />
                  ))}
                </FilterGroup>
              )}

              <FilterGroup label={t('search.filter.privacy')}>
                {PRIVACY_OPTIONS.map((opt) => (
                  <FilterChip
                    key={opt.value}
                    label={opt.label}
                    selected={(draft.privacy || []).includes(opt.value)}
                    onClick={() => toggleValue('privacy', opt.value)}
                  />
                ))}
              </FilterGroup>

              <FilterGroup label={t('search.filter.group_size')}>
                {GROUP_SIZE_OPTIONS.map((opt) => (
                  <FilterChip
                    key={opt.value}
                    label={opt.label}
                    selected={(draft.group_size || []).includes(opt.value)}
                    onClick={() => toggleValue('group_size', opt.value)}
                  />
                ))}
              </FilterGroup>
            </>
          )}

          {tab === 'experiences' && (
            <>
              {availableCategories?.length > 0 && (
                <FilterGroup label={t('search.filter.category')}>
                  {availableCategories.map((cat) => (
                    <FilterChip
                      key={cat}
                      label={categoryLabel(t, cat)}
                      selected={(draft.category || []).includes(cat)}
                      onClick={() => toggleValue('category', cat)}
                    />
                  ))}
                </FilterGroup>
              )}

              <FilterGroup label={t('search.filter.date')}>
                {DATE_OPTIONS.map((opt) => (
                  <FilterChip
                    key={opt.value}
                    label={opt.label}
                    selected={(draft.date || []).includes(opt.value)}
                    onClick={() => toggleValue('date', opt.value)}
                  />
                ))}
              </FilterGroup>

              {memberLocation && (
                <FilterGroup label={t('search.filter.distance')}>
                  {DISTANCE_OPTIONS.map((opt) => (
                    <FilterChip
                      key={opt.value}
                      label={opt.label}
                      selected={(draft.distance || []).includes(opt.value)}
                      onClick={() => toggleValue('distance', opt.value)}
                    />
                  ))}
                </FilterGroup>
              )}

              <FilterGroup label={t('search.filter.price')}>
                {PRICE_OPTIONS.map((opt) => (
                  <FilterChip
                    key={opt.value}
                    label={opt.label}
                    selected={(draft.price || []).includes(opt.value)}
                    onClick={() => toggleValue('price', opt.value)}
                  />
                ))}
              </FilterGroup>

              <FilterGroup label={t('search.filter.available_spots')}>
                {SPOTS_OPTIONS.map((opt) => (
                  <FilterChip
                    key={opt.value}
                    label={opt.label}
                    selected={(draft.spots || []).includes(opt.value)}
                    onClick={() => toggleValue('spots', opt.value)}
                  />
                ))}
              </FilterGroup>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 pt-3 pb-6 border-t border-border flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={clearAll} disabled={activeCount === 0} className="flex-1">
            <RotateCcw className="w-3.5 h-3.5" />
            {t('search.clear_all')}
          </Button>
          <Button size="sm" onClick={handleApply} className="flex-[2]">
            {t('search.apply_filters')}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function FilterGroup({ label, children }) {
  return (
    <div className="space-y-2.5">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
      <div className="flex flex-wrap gap-2">
        {children}
      </div>
    </div>
  );
}

function FilterChip({ label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 rounded-full text-sm font-medium transition-default border ${
        selected
          ? 'bg-primary/10 text-primary border-primary/20'
          : 'bg-card text-muted-foreground border-border hover:border-primary/30 hover:bg-muted/30'
      }`}
    >
      {selected && <Check className="w-3 h-3" strokeWidth={3} />}
      {label}
    </button>
  );
}