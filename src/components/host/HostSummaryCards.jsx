import React from 'react';
import { Calendar, Radio, FileText, Check, UserPlus, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function HostSummaryCards({ stats }) {
  const cards = [
    { label: 'Upcoming', value: stats.upcoming, icon: Calendar, tint: 'text-primary' },
    { label: 'Live', value: stats.live, icon: Radio, tint: 'text-success' },
    { label: 'Drafts', value: stats.drafts, icon: FileText, tint: 'text-muted-foreground' },
    { label: 'Completed', value: stats.completed, icon: Check, tint: 'text-primary' },
    { label: 'Requests', value: stats.pendingRequests, icon: UserPlus, tint: 'text-warning' },
    { label: 'Participants', value: stats.totalParticipants, icon: Users, tint: 'text-primary' },
  ];

  return (
    <div className="grid grid-cols-3 gap-2.5 mb-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.label} className="p-3 text-center">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-1.5">
              <Icon className={'w-4 h-4 ' + card.tint} />
            </div>
            <p className="text-lg font-bold leading-tight">{card.value}</p>
            <p className="text-[10px] text-muted-foreground leading-tight">{card.label}</p>
          </Card>
        );
      })}
    </div>
  );
}