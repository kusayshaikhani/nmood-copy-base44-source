import React from 'react';

/**
 * UI-017 — Premium skeleton mimicking the redesigned profile layout:
 * hero, avatar, badges, name, stats, about, gallery.
 */
export default function ProfileSkeleton() {
  return (
    <div>
      <div className="h-[280px] bg-muted rounded-b-[32px] shimmer" />
      <div className="flex flex-col items-center -mt-20 px-6">
        <div className="w-32 h-32 rounded-full bg-card border-4 border-card shadow-elevated shimmer" />
        <div className="flex gap-2 mt-4">
          <div className="w-20 h-7 rounded-full bg-muted shimmer" />
          <div className="w-24 h-7 rounded-full bg-muted shimmer" />
        </div>
      </div>
      <div className="px-6 mt-3 space-y-2 text-center">
        <div className="h-7 w-48 mx-auto rounded-lg bg-muted shimmer" />
        <div className="h-4 w-64 mx-auto rounded bg-muted shimmer" />
      </div>
      <div className="px-6 mt-4 flex gap-2.5">
        <div className="flex-1 h-12 rounded-button bg-muted shimmer" />
        <div className="flex-1 h-12 rounded-button bg-muted shimmer" />
        <div className="flex-1 h-12 rounded-button bg-muted shimmer" />
      </div>
      <div className="flex gap-3 overflow-hidden px-6 mt-8">
        {[0, 1, 2, 3].map((i) => <div key={i} className="flex-shrink-0 w-32 h-24 rounded-card bg-muted shimmer" />)}
      </div>
      <div className="px-6 mt-8 space-y-3">
        <div className="h-5 w-32 rounded-lg bg-muted shimmer" />
        <div className="h-20 rounded-card bg-muted shimmer" />
      </div>
      <div className="px-6 mt-8">
        <div className="flex gap-3 overflow-hidden">
          {[0, 1, 2].map((i) => <div key={i} className="flex-shrink-0 w-40 h-40 rounded-card bg-muted shimmer" />)}
        </div>
      </div>
    </div>
  );
}