import React from 'react';

/**
 * UI-004 Phase 4 — Premium shimmer skeleton matching the Discover layout.
 * Live Pulse → Discovery Insight → Chosen for You (featured) →
 * Experiences Near You → AI Picks → People Are Loving (circles).
 * Spacing (space-y-14) and card heights match the final layout exactly
 * to prevent any content jump when data arrives.
 */
export default function DiscoverSkeleton() {
  return (
    <div className="space-y-14 animate-fade-in">
      {/* Live Pulse — horizontal stat bar */}
      <div className="h-14 rounded-2xl shimmer" />

      {/* Discovery Insight — contextual recommendation bar */}
      <div className="h-12 rounded-2xl shimmer" />

      {/* Recommended for You — featured card skeleton */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="h-7 w-48 rounded-lg shimmer" />
          <div className="h-5 w-16 rounded-lg shimmer" />
        </div>
        <div className="h-[320px] w-full rounded-[28px] shimmer" />
      </div>

      {/* Experiences Near You — carousel skeleton */}
      <div>
        <div className="h-7 w-40 rounded-lg shimmer mb-4" />
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="w-[176px] h-[220px] rounded-2xl shimmer flex-shrink-0" />
          ))}
        </div>
      </div>

      {/* AI Picks — gradient card skeleton */}
      <div className="h-[180px] w-full rounded-[28px] shimmer" />

      {/* People Are Loving — circles carousel skeleton */}
      <div>
        <div className="h-7 w-36 rounded-lg shimmer mb-4" />
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="w-[200px] h-[200px] rounded-2xl shimmer flex-shrink-0" />
          ))}
        </div>
      </div>
    </div>
  );
}