import React, { useState } from 'react';
import { Check } from 'lucide-react';

/**
 * SuggestedCoverThumb — single source of truth for suggested cover thumbnails
 * used by both Create Experience and Create Circle.
 *
 * Candidates are pre-verified by useAvailableCovers, so only sources known to
 * decode reach this component. If one still fails (stale cache, network lost
 * mid-render) it reports back through onUnavailable and the parent drops the
 * tile — a blank or broken tile is never left on screen.
 */
export default function SuggestedCoverThumb({ src, selected, onSelect, onUnavailable }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <button
      type="button"
      onClick={() => onSelect(src)}
      aria-pressed={selected}
      className={`relative w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 snap-start border-2 transition-all active:scale-95 ${
        selected ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/40'
      }`}
    >
      <img
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onLoad={() => setLoaded(true)}
        onError={() => onUnavailable?.(src)}
        className={`h-full w-full object-cover transition-opacity duration-300 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
      {!loaded && <div className="absolute inset-0 shimmer" />}

      {selected && (
        <span className="pointer-events-none absolute end-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-soft">
          <Check className="h-3 w-3" strokeWidth={3} />
        </span>
      )}
    </button>
  );
}