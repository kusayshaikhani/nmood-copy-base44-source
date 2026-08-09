import React from 'react';
import { motion } from 'framer-motion';

/**
 * Category chips for the InMood V2 feed.
 * `key`  — used for filtering (matches PEOPLE_KEYWORDS in InMoodV2).
 * `label` — display copy.
 */
export const V2_CATEGORIES = [
  { key: 'All', label: 'All' },
  { key: 'Coffee', label: 'Coffee' },
  { key: 'Food', label: 'Food & Drinks' },
  { key: 'Outdoor', label: 'Outdoor' },
  { key: 'Music', label: 'Music' },
  { key: 'Sports', label: 'Sports' },
  { key: 'Movies', label: 'Movies' },
  { key: 'Gaming', label: 'Gaming' },
  { key: 'Learning', label: 'Learning' },
  { key: 'Travel', label: 'Travel' },
  { key: 'Photography', label: 'Photography' },
  { key: 'Nightlife', label: 'Nightlife' },
  { key: 'More', label: 'More' },
];

export default function V2CategoryChips({ active, onChange }) {
  return (
    <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-5 px-5 pb-1 momentum-scroll touch-pan-x scroll-smooth">
      {V2_CATEGORIES.map(({ key, label }) => {
        const on = active === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={`relative flex-shrink-0 h-9 px-4 inline-flex items-center rounded-full text-[13px] font-medium whitespace-nowrap transition-colors duration-200 active:scale-[0.96] ${
              on
                ? 'text-white'
                : 'bg-muted text-muted-foreground border border-border/40 hover:bg-muted/70 hover:text-foreground'
            }`}
          >
            {on && (
              <motion.span
                layoutId="v2-chip-active"
                className="absolute inset-0 rounded-full bg-nmood-cta shadow-[0_8px_22px_-10px_rgba(91,61,245,0.45)]"
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              />
            )}
            <span className="relative z-10">{label}</span>
          </button>
        );
      })}
    </div>
  );
}