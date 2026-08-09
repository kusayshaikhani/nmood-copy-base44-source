import React from 'react';

export default function InMoodPeopleSkeleton({ count = 4 }) {
  return (
    <div className="space-y-[14px]">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex w-full rounded-[22px] overflow-hidden bg-card border border-border/50 shadow-card min-h-[230px]"
        >
          {/* Portrait */}
          <div className="w-[40%] flex-shrink-0 bg-muted animate-pulse" />
          {/* Content */}
          <div className="flex-1 p-[18px] flex flex-col">
            <div className="w-28 h-4 rounded bg-muted animate-pulse" />
            <div className="w-20 h-3 rounded bg-muted/70 animate-pulse mt-2" />
            <div className="my-3 h-px bg-border" />
            <div className="w-16 h-2.5 rounded bg-muted/70 animate-pulse" />
            <div className="w-[85%] h-3.5 rounded bg-muted animate-pulse mt-2" />
            <div className="flex gap-1.5 mt-3">
              <div className="w-12 h-5 rounded-full bg-muted/70 animate-pulse" />
              <div className="w-10 h-5 rounded-full bg-muted/70 animate-pulse" />
            </div>
            <div className="flex gap-2 mt-auto pt-4">
              <div className="flex-1 h-10 rounded-full bg-muted animate-pulse" />
              <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}