import React, { useState } from 'react';
import { Filter, Check, ChevronDown } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { filterOptions } from '@/lib/matchmaker-data';
import { LOOKING_FOR_TAGS, ZODIAC_SIGNS, lookingForTagLabel, zodiacLabel } from '@/lib/looking-for-tags';
import { useLocalization } from '@/lib/i18n/useLocalization';

/**
 * Upgraded People discovery filter sheet.
 * Grouped, collapsible multi-select: OR within each group, AND between groups.
 * Groups: What they're looking for, Languages, Zodiac, Distance, Interests.
 * "More filters" (collapsed by default): Goals, Circles.
 */
function CollapsibleGroup({ label, count, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border/30">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between py-3 min-h-[44px]"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
          {label}
          {count > 0 && (
            <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full leading-none">
              {count}
            </span>
          )}
        </span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="flex flex-wrap gap-1.5 pb-3">{children}</div>}
    </div>
  );
}

function Chip({ label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2.5 py-1.5 rounded-full border text-xs font-medium transition-default min-h-[36px] ${
        selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:border-primary/40'
      }`}
    >
      {label}
    </button>
  );
}

export default function MatchmakerFilters({ open, onOpenChange, filters, onApply, hasLookingFor, hasZodiac }) {
  const { t } = useLocalization();
  const [localFilters, setLocalFilters] = useState(filters);
  const [showMore, setShowMore] = useState(
    Boolean(localFilters.goals?.length || localFilters.circles?.length)
  );

  // Sync from parent when sheet opens
  React.useEffect(() => {
    if (open) {
      setLocalFilters(filters);
      setShowMore(Boolean(filters.goals?.length || filters.circles?.length));
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleArray = (key, value) => {
    setLocalFilters((prev) => {
      const arr = prev[key] || [];
      return { ...prev, [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value] };
    });
  };

  const setSingle = (key, value) => {
    setLocalFilters((prev) => ({ ...prev, [key]: prev[key] === value ? undefined : value }));
  };

  const handleApply = () => {
    onApply(localFilters);
    onOpenChange(false);
  };

  const handleClearAll = () => {
    const empty = {};
    setLocalFilters(empty);
    onApply(empty);
    onOpenChange(false);
  };

  const activeCount = Object.values(localFilters).reduce(
    (sum, v) => sum + (Array.isArray(v) ? v.length : v ? 1 : 0),
    0
  );

  const DISTANCE_OPTIONS = [
    { value: 'nearby', label: t('discovery.filters.distance.nearby') },
    { value: 'same_country', label: t('discovery.filters.distance.same_country') },
    { value: 'anywhere', label: t('discovery.filters.distance.anywhere') },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl pb-[env(safe-area-inset-bottom)] max-h-[90vh] overflow-y-auto no-scrollbar">
        <div className="mx-auto w-10 h-1 rounded-full bg-muted mb-4" />
        <SheetHeader className="mb-2">
          <SheetTitle className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            {t('discovery.filters.discovery_title')}
            {activeCount > 0 && (
              <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">{activeCount}</span>
            )}
          </SheetTitle>
          <SheetDescription>{t('discovery.filters.discovery_desc')}</SheetDescription>
        </SheetHeader>

        <div className="space-y-1 mt-3">
          {/* What they're looking for — only if at least one member has tags */}
          {hasLookingFor && (
            <CollapsibleGroup label={t('discovery.filters.group.looking_for')} count={localFilters.looking_for?.length || 0}>
              {LOOKING_FOR_TAGS.map((tag) => (
                <Chip
                  key={tag}
                  label={lookingForTagLabel(t, tag)}
                  selected={localFilters.looking_for?.includes(tag)}
                  onClick={() => toggleArray('looking_for', tag)}
                />
              ))}
            </CollapsibleGroup>
          )}

          {/* Interests */}
          <CollapsibleGroup label={t('discovery.filters.group.interests')} count={localFilters.interests?.length || 0}>
            {filterOptions.interests.map((opt) => (
              <Chip
                key={opt}
                label={opt}
                selected={localFilters.interests?.includes(opt)}
                onClick={() => toggleArray('interests', opt)}
              />
            ))}
          </CollapsibleGroup>

          {/* Languages */}
          <CollapsibleGroup label={t('discovery.filters.group.languages')} count={localFilters.languages?.length || 0}>
            {filterOptions.languages.map((opt) => (
              <Chip
                key={opt}
                label={opt}
                selected={localFilters.languages?.includes(opt)}
                onClick={() => toggleArray('languages', opt)}
              />
            ))}
          </CollapsibleGroup>

          {/* Zodiac — only if at least one member has a zodiac sign */}
          {hasZodiac && (
            <CollapsibleGroup label={t('discovery.filters.group.zodiac')} count={localFilters.zodiac?.length || 0}>
              {ZODIAC_SIGNS.map((sign) => (
                <Chip
                  key={sign}
                  label={zodiacLabel(t, sign)}
                  selected={localFilters.zodiac?.includes(sign)}
                  onClick={() => toggleArray('zodiac', sign)}
                />
              ))}
            </CollapsibleGroup>
          )}

          {/* Distance — single select */}
          <CollapsibleGroup label={t('discovery.filters.group.distance')} count={localFilters.distance ? 1 : 0}>
            {DISTANCE_OPTIONS.map((opt) => (
              <Chip
                key={opt.value}
                label={opt.label}
                selected={localFilters.distance === opt.value}
                onClick={() => setSingle('distance', opt.value)}
              />
            ))}
          </CollapsibleGroup>

          {/* More filters — collapsed by default */}
          <div>
            <button
              type="button"
              onClick={() => setShowMore((s) => !s)}
              className="w-full flex items-center justify-between py-3 min-h-[44px]"
            >
              <span className="text-sm font-semibold text-muted-foreground">{t('discovery.filters.group.more')}</span>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showMore ? 'rotate-180' : ''}`} />
            </button>
            {showMore && (
              <div className="space-y-1 pb-2">
                <CollapsibleGroup label={t('discovery.filters.group.goals')} count={localFilters.goals?.length || 0} defaultOpen={true}>
                  {filterOptions.goals.map((opt) => (
                    <Chip
                      key={opt}
                      label={opt}
                      selected={localFilters.goals?.includes(opt)}
                      onClick={() => toggleArray('goals', opt)}
                    />
                  ))}
                </CollapsibleGroup>
                <CollapsibleGroup label={t('discovery.filters.group.circles')} count={localFilters.circles?.length || 0} defaultOpen={true}>
                  {filterOptions.circles.map((opt) => (
                    <Chip
                      key={opt}
                      label={opt}
                      selected={localFilters.circles?.includes(opt)}
                      onClick={() => toggleArray('circles', opt)}
                    />
                  ))}
                </CollapsibleGroup>
              </div>
            )}
          </div>
        </div>

        <SheetFooter className="mt-6 flex-row gap-2">
          <Button variant="ghost" className="flex-1" onClick={handleClearAll}>
            {t('discovery.filters.clear_all')}
          </Button>
          <Button className="flex-1" onClick={handleApply}>
            <Check className="w-4 h-4" />
            {t('discovery.filters.apply_filters')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}