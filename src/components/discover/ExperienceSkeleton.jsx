import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

/** UI-004 — premium loading skeleton matching the large event card. */
export default function ExperienceSkeleton({ compact }) {
  return (
    <div className={`rounded-card overflow-hidden border border-border/40 bg-card ${compact ? 'w-72 flex-shrink-0' : 'w-full'}`}>
      <Skeleton className="h-56 w-full rounded-none" />
      <div className="p-5 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        {!compact && <Skeleton className="h-3 w-full" />}
        {!compact && <Skeleton className="h-3 w-2/3" />}
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-full" />
        </div>
        <Skeleton className="h-11 w-full rounded-button" />
      </div>
    </div>
  );
}