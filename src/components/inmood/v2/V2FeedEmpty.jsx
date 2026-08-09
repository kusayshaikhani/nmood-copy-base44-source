import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, SlidersHorizontal, Sparkles, ArrowRight } from 'lucide-react';

const VARIANTS = {
  nearby: {
    icon: MapPin,
    headline: "No one nearby is Nmood right now.",
    subtitle: "Try expanding your distance or explore another category.",
    primary: { label: 'Expand Search', action: 'onExpandSearch' },
    secondary: { label: 'Explore All', action: 'onExploreAll' },
  },
  filters: {
    icon: SlidersHorizontal,
    headline: "No matches found.",
    subtitle: "Try different filters or search another activity.",
    primary: { label: 'Reset Filters', action: 'onResetFilters' },
    secondary: null,
  },
  new_member: {
    icon: Sparkles,
    headline: "We're finding your people.",
    subtitle: "Complete your interests and we'll recommend members you'll love meeting.",
    primary: { label: 'Complete Profile', action: 'onCompleteProfile' },
    secondary: null,
  },
};

export default function V2FeedEmpty({
  variant = 'nearby',
  onExpandSearch,
  onExploreAll,
  onResetFilters,
  onCompleteProfile,
}) {
  const v = VARIANTS[variant] || VARIANTS.nearby;
  const Icon = v.icon;

  const actions = { onExpandSearch, onExploreAll, onResetFilters, onCompleteProfile };
  const primaryHandler = actions[v.primary.action];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-card border border-border/40 bg-card p-8 text-center shadow-soft"
    >
      {/* Brand-glyph visual */}
      <div className="relative w-16 h-16 mx-auto">
        <div className="absolute inset-0 rounded-card bg-primary/10 ring-1 ring-primary/15" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon className="w-7 h-7 text-primary" strokeWidth={1.8} />
        </div>
      </div>

      <h3 className="text-lg font-semibold leading-tight text-foreground mt-5 tracking-tight">
        {v.headline}
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed mt-2 max-w-[34ch] mx-auto">
        {v.subtitle}
      </p>

      <div className="flex flex-col gap-2.5 mt-6 max-w-[240px] mx-auto">
        {primaryHandler && (
          <button
            type="button"
            onClick={primaryHandler}
            className="h-11 rounded-button bg-nmood-cta text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            {v.primary.label}
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
        {v.secondary && (
          <button
            type="button"
            onClick={actions[v.secondary.action]}
            className="h-11 rounded-button border border-border bg-card text-foreground text-sm font-medium hover:bg-muted/50 transition-colors"
          >
            {v.secondary.label}
          </button>
        )}
      </div>
    </motion.div>
  );
}