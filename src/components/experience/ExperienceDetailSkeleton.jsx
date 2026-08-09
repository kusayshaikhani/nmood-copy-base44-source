import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function ExperienceDetailSkeleton() {
  return (
    <div className="space-y-6 pb-4">
      <Skeleton className="h-72 sm:h-96 w-full rounded-b-3xl" />
      <div className="space-y-4">
        <div className="space-y-2.5">
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <Skeleton className="h-8 w-3/4" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
    </div>
  );
}