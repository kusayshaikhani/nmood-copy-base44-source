import React from 'react';
import { motion } from 'framer-motion';
import { INMOOD_CATEGORIES } from '@/lib/inmood-categories';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function InMoodCategoryBar({ active, onChange }) {
  const { t } = useLocalization();
  return (
    <div className="flex gap-2.5 overflow-x-auto no-scrollbar overscroll-x-contain -mx-4 px-4 pb-2 momentum-scroll">
      {INMOOD_CATEGORIES.map((c) => {
        const isActive = active === c.key;
        return (
          <button
            key={c.key}
            type="button"
            onClick={() => onChange(c.key)}
            aria-pressed={isActive}
            className="relative flex-shrink-0 flex items-center gap-2 h-11 px-5 rounded-full text-sm font-semibold transition-all duration-300 active:scale-[0.96]"
          >
            {isActive ? (
              <motion.span
                layoutId="inmood-category-pill"
                className="absolute inset-0 rounded-full bg-nmood-cta shadow-card"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            ) : (
              <span className="absolute inset-0 rounded-full bg-card/80 backdrop-blur-sm border border-border/40 shadow-soft" />
            )}
            <span className={`relative z-10 flex items-center gap-2 ${isActive ? 'text-primary-foreground' : 'text-foreground/85'}`}>
              <span className="text-base leading-none">{c.icon}</span>
              <span className="tracking-tight">{t(`inmood.redesign.categories.${c.key}`)}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}