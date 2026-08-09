import React from 'react';
import { motion } from 'framer-motion';

export const PEOPLE_CATEGORIES = [
  'All',
  'AI',
  'Food',
  'Outdoor',
  'Music',
  'Coffee',
  'Gaming',
  'Sports',
  'Movies',
  'Learning',
  'Nightlife',
  'Travel',
  'Photography',
];

export default function InMoodPeopleCategories({ active, onChange }) {
  return (
    <div className="flex gap-2.5 overflow-x-auto no-scrollbar overscroll-x-contain -mx-4 px-4 pb-1 momentum-scroll">
      {PEOPLE_CATEGORIES.map((c) => {
        const isActive = active === c;
        return (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            aria-pressed={isActive}
            className="relative flex-shrink-0 flex items-center h-9 px-3.5 rounded-full text-sm font-semibold transition-all duration-300 active:scale-95"
          >
            {isActive ? (
              <motion.span
                layoutId="inmood-people-cat"
                className="absolute inset-0 rounded-full bg-nmood-cta shadow-sm shadow-primary/25"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            ) : (
              <span className="absolute inset-0 rounded-full bg-muted border border-border/60" />
            )}
            <span className={`relative z-10 tracking-tight ${isActive ? 'text-white' : 'text-muted-foreground'}`}>
              {c}
            </span>
          </button>
        );
      })}
    </div>
  );
}