import React from 'react';

export default function V2FeedSkeleton({ count = 4 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex w-full min-h-[240px] rounded-card overflow-hidden bg-card border border-border/40 shadow-card"
        >
          {/* Portrait */}
          <div className="w-[40%] flex-shrink-0 bg-muted animate-pulse" />
          {/* Content */}
          <div className="w-[60%] p-5 flex flex-col">
            <div className="w-20 h-3 rounded-full bg-muted animate-pulse" />
            <div className="w-[85%] h-4 rounded-full bg-muted animate-pulse mt-3" />
            <div className="w-[60%] h-3 rounded-full bg-muted animate-pulse mt-3" />
            <div className="flex-1" />
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-muted animate-pulse" />
              <div className="w-24 h-3 rounded-full bg-muted animate-pulse" />
            </div>
            <div className="flex gap-1.5 mt-3">
              <div className="w-12 h-5 rounded-full bg-muted animate-pulse" />
              <div className="w-10 h-5 rounded-full bg-muted animate-pulse" />
            </div>
            <div className="flex gap-3 mt-5">
              <div className="flex-1 h-11 rounded-button bg-muted animate-pulse" />
              <div className="flex-1 h-11 rounded-button bg-muted animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}