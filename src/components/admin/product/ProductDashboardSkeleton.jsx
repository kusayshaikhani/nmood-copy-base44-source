import React from 'react';
import { Card } from '@/components/ui/card';

export default function ProductDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="p-4 h-24 shimmer rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5 h-40 shimmer rounded-xl" />
        <Card className="p-5 h-40 shimmer rounded-xl" />
      </div>
    </div>
  );
}