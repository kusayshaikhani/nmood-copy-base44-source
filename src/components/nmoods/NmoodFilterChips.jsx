import React from 'react';
import { motion } from 'framer-motion';
import { nmoodFilters } from '@/lib/nmoods-data';

/**
 * Horizontally scrollable filter chips for the Nmoods feed.
 * Only one chip can be active at a time. Selecting refreshes the feed
 * with a smooth animation (handled by parent AnimatePresence).
 */
export default function NmoodFilterChips({ active, onChange }) {
  return (
    <div className="sticky top-0 z-20 bg-background py-2.5">
      <div className="flex gap-2 overflow-x-auto no-scrollbar overscroll-x-contain px-5 snap-x">
        {nmoodFilters.map((chip) => {
          const isActive = active === chip.id;
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => onChange(chip.id)}
              data-active={isActive}
              className="nmood-chip flex-shrink-0 snap-start"
            >
              {chip.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}