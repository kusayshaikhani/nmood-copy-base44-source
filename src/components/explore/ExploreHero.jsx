import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Search, SlidersHorizontal, Map, Sparkles, MapPin, Flame, Star } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';
import SmartGreeting from '@/components/explore/SmartGreeting';
import WeatherStrip from '@/components/explore/WeatherStrip';
import ThemeToggle from '@/components/layout/ThemeToggle';
import HeaderAvatar from '@/components/layout/HeaderAvatar';

const CHIPS = [
  { value: 'for_you', labelKey: 'discovery.chip.for_you', Icon: Sparkles },
  { value: 'nearby', labelKey: 'discovery.chip.nearby', Icon: MapPin },
  { value: 'trending', labelKey: 'discovery.chip.trending', Icon: Flame },
  { value: 'new', labelKey: 'discovery.chip.new', Icon: Star },
];

/**
 * UI-004 Phase 4 — Premium gradient hero with entrance animations
 * and gentle scroll-collapse parallax on the title/subtitle area.
 */
export default function ExploreHero({ title, subtitle, search, onSearchChange, view, onViewChange, onOpenFilters, activeChip, onChipChange }) {
  const { t } = useLocalization();
  const isMap = view === 'map';
  const { scrollY } = useScroll();
  const headerY = useTransform(scrollY, [0, 200], [0, -15]);
  const headerOpacity = useTransform(scrollY, [0, 150], [1, 0.3]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="relative px-5 pt-[calc(2.75rem+env(safe-area-inset-top))] pb-11"
      style={{ background: 'linear-gradient(180deg, #2F1C8F 0%, #6C63FF 100%)' }}
    >
      {/* Title + buttons — gently collapses on scroll */}
      <motion.div style={{ y: headerY, opacity: headerOpacity }}>
        <div className="flex items-start justify-between gap-3">
          <SmartGreeting />
          <div className="flex gap-2 flex-shrink-0 items-center">
            <ThemeToggle variant="hero" />
            <button
              type="button"
              onClick={onOpenFilters}
              aria-label={t('discovery.aria.filters')}
              className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center active:scale-95 transition-transform duration-200"
            >
              <SlidersHorizontal className="w-5 h-5 text-white" />
            </button>
            <button
              type="button"
              onClick={() => onViewChange(isMap ? 'cards' : 'map')}
              aria-label={t('discovery.aria.map_view')}
              className={`w-10 h-10 rounded-full backdrop-blur-md border flex items-center justify-center active:scale-95 transition-transform duration-200 ${
                isMap ? 'bg-white/30 border-white/40' : 'bg-white/15 border-white/25'
              }`}
            >
              <Map className="w-5 h-5 text-white" />
            </button>
            <HeaderAvatar variant="hero" />
          </div>
        </div>
        <WeatherStrip />
      </motion.div>

      {/* Search bar — slides upward on entry */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4, ease: 'easeOut' }}
        className="relative mt-4"
      >
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60 z-10" />
        <input
          value={search}
          onChange={onSearchChange}
          placeholder={t('discovery.search_placeholder')}
          className="w-full h-[52px] pl-12 pr-4 text-sm text-white placeholder:text-white/60 rounded-[26px] bg-white/10 backdrop-blur-md border border-white/20 focus:bg-white/15 focus:outline-none transition-default"
        />
      </motion.div>

      {/* Discovery chips — stagger fade one-by-one */}
      <div className="flex gap-2 mt-4 overflow-x-auto no-scrollbar overscroll-x-contain">
        {CHIPS.map(({ value, labelKey, Icon }, i) => {
          const active = activeChip === value;
          return (
            <motion.button
              key={value}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.06, duration: 0.3, ease: 'easeOut' }}
              onClick={() => onChipChange(value)}
              type="button"
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium flex-shrink-0 transition-default border snap-start ${
                active
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-white/10 text-white border-white/15 backdrop-blur-md'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t(labelKey)}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}