import React, { useState } from 'react';
import { Check, Sparkles } from 'lucide-react';

/**
 * SuggestedCoverThumb — single source of truth for suggested cover thumbnails
 * used by both Create Experience and Create Circle.
 *
 * - Validates each source via onLoad/onError; never shows the browser broken-image icon.
 * - Shows a branded shimmer while loading, a polished branded placeholder on failure.
 * - Consistent 96×96 (w-24 h-24) square, 16px radius, unified selected state.
 */
export default function SuggestedCoverThumb({ src, selected, onSelect }) {
  const [status, setStatus] = useState('loading'); // 'loading' | 'loaded' | 'failed'

  const handleClick = () => {
    if (status === 'failed') return;
    onSelect(src);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={selected}
      className={`relative w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 snap-start border-2 transition-all active:scale-95 ${
        selected ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/40'
      }`}
    >
      {status === 'failed' ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/70 backdrop-blur-sm shadow-soft">
            <Sparkles className="h-4 w-4 text-primary/70" />
          </span>
        </div>
      ) : (
        <>
          <img
            src={src}
            alt=""
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onLoad={() => setStatus('loaded')}
            onError={() => setStatus('failed')}
            className={`h-full w-full object-cover transition-opacity duration-300 ${
              status === 'loaded' ? 'opacity-100' : 'opacity-0'
            }`}
          />
          {status === 'loading' && <div className="absolute inset-0 shimmer" />}
        </>
      )}

      {selected && (
        <span className="pointer-events-none absolute end-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-soft">
          <Check className="h-3 w-3" strokeWidth={3} />
        </span>
      )}
    </button>
  );
}