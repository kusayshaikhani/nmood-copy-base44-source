import React from 'react';

/**
 * Premium skeleton loader for the Circle Details screen.
 */
export default function CircleDetailSkeleton() {
  return (
    <div className="pb-40">
      <div className="w-full h-[320px] rounded-b-[32px] shimmer" />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 -mt-8 relative z-10 space-y-8">
        <div className="space-y-3">
          <div className="h-7 w-2/3 rounded-lg shimmer" />
          <div className="h-4 w-1/2 rounded-lg shimmer" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-card shimmer" />
          ))}
        </div>
        <div className="space-y-3">
          <div className="h-5 w-1/3 rounded-lg shimmer" />
          <div className="h-20 rounded-card shimmer" />
        </div>
        <div className="space-y-3">
          <div className="h-5 w-1/4 rounded-lg shimmer" />
          <div className="flex gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-14 h-14 rounded-full shimmer flex-shrink-0" />
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-5 w-1/3 rounded-lg shimmer" />
          <div className="flex gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="w-72 h-52 rounded-card shimmer flex-shrink-0" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}