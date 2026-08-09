import React from 'react';

export default function InMoodFeedSkeleton() {
  return (
    <div className="space-y-[10px]">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex flex-row w-full rounded-[20px] overflow-hidden border border-border/30 bg-card shadow-soft min-h-[290px]">
          {/* Portrait — 40% */}
          <div className="w-[40%] flex-shrink-0 shimmer" />
          {/* Content — 60% */}
          <div className="flex-1 min-w-0 p-4 sm:p-5 flex flex-col">
            {/* Icon + label */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full shimmer" />
              <div className="w-20 h-2.5 rounded shimmer" />
            </div>
            {/* Title */}
            <div className="w-[85%] h-5 rounded shimmer mt-3" />
            {/* AI insight */}
            <div className="w-1/2 h-3 rounded shimmer mt-2.5" />
            {/* Details row */}
            <div className="flex gap-3 mt-3">
              <div className="w-14 h-3 rounded shimmer" />
              <div className="w-12 h-3 rounded shimmer" />
              <div className="w-20 h-3 rounded shimmer" />
            </div>
            <div className="border-t border-border/30 my-4" />
            {/* Member row */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full shimmer" />
              <div className="space-y-1.5 flex-1">
                <div className="w-28 h-3 rounded shimmer" />
                <div className="flex gap-1.5">
                  <div className="w-12 h-2.5 rounded-full shimmer" />
                  <div className="w-10 h-2.5 rounded-full shimmer" />
                </div>
              </div>
            </div>
            {/* Social proof */}
            <div className="w-24 h-2.5 rounded shimmer mt-3" />
            {/* Buttons */}
            <div className="flex gap-2.5 mt-auto pt-5">
              <div className="flex-1 h-11 min-h-[44px] rounded-button shimmer" />
              <div className="flex-1 h-11 min-h-[44px] rounded-button shimmer" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}