import React from 'react';
import { Card } from '@/components/ui/card';

export default function MilestoneBadge({ milestone }) {
  const { title, description, icon: Icon, achieved, date } = milestone;

  return (
    <Card className={'p-4 text-center ' + (achieved ? 'border-primary/20' : 'opacity-60')}>
      <div className={'w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2.5 ' + (achieved ? 'bg-primary/10' : 'bg-muted')}>
        <Icon className={'w-6 h-6 ' + (achieved ? 'text-primary' : 'text-muted-foreground')} />
      </div>
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      {achieved && date ? (
        <p className="text-xs text-primary mt-2 font-medium">{date}</p>
      ) : (
        <p className="text-xs text-muted-foreground mt-2">Not yet</p>
      )}
    </Card>
  );
}