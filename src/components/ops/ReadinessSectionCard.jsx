import React from 'react';
import { Card } from '@/components/ui/card';
import StatusBadge from './StatusBadge';

export default function ReadinessSectionCard({ name, score, status, description }) {
  const barColor = score >= 85 ? 'bg-success' : score >= 70 ? 'bg-warning' : 'bg-destructive';

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold">{name}</h3>
          <p className="text-xs text-muted-foreground truncate">{description}</p>
        </div>
        <span className="text-xl font-bold flex-shrink-0">{score}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden mb-2.5">
        <div className={'h-full rounded-full transition-all ' + barColor} style={{ width: score + '%' }} />
      </div>
      <StatusBadge status={status} />
    </Card>
  );
}