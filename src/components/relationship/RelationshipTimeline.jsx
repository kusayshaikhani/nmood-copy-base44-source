import React from 'react';
import { Card } from '@/components/ui/card';

export default function RelationshipTimeline({ events }) {
  return (
    <div className="relative">
      {events.map((event, i) => {
        const Icon = event.icon;
        return (
          <div key={event.id} className="flex gap-4 pb-5 last:pb-0">
            <div className="flex flex-col items-center flex-shrink-0">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center ring-4 ring-background">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              {i < events.length - 1 && <div className="w-0.5 flex-1 bg-border mt-1 min-h-[24px]" />}
            </div>
            <Card className="p-4 flex-1">
              <p className="text-sm font-medium">{event.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>
              <p className="text-xs text-muted-foreground/70 mt-1.5">{event.date}</p>
            </Card>
          </div>
        );
      })}
    </div>
  );
}