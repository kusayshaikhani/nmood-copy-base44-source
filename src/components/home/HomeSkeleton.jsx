import React from 'react';

/** UI-003 — premium Home loading skeleton matching the concept layout. */
export default function HomeSkeleton() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      {/* Gradient hero */}
      <div className="bg-nmood-gradient px-6 pt-14 pb-20">
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 rounded-full bg-white/20" />
          <div className="h-7 w-24 bg-white/20 rounded" />
          <div className="w-10 h-10 rounded-full bg-white/20" />
        </div>
        <div className="mt-8 h-4 w-40 bg-white/20 rounded" />
        <div className="mt-2 h-9 w-64 bg-white/20 rounded" />
        <div className="mt-6 flex gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-[90px] h-[90px] rounded-card bg-white/15" />
          ))}
        </div>
      </div>
      {/* Rounded white content container */}
      <div className="relative -mt-8 rounded-t-[32px] bg-card px-6 pt-8 pb-28 space-y-10">
        <div className="h-5 w-32 bg-muted rounded" />
        <div className="flex gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="w-44 h-64 rounded-card bg-muted" />
          ))}
        </div>
        <div className="h-5 w-40 bg-muted rounded" />
        <div className="h-56 rounded-card bg-muted" />
        <div className="h-5 w-36 bg-muted rounded" />
        <div className="flex gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-16 h-16 rounded-full bg-muted" />
          ))}
        </div>
      </div>
    </div>
  );
}