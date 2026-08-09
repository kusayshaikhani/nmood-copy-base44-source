import React from 'react';
import { Calendar, Clock, Timer, MapPin, Navigation, Users } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function PlanDetailGrid({ post }) {
  const { t } = useLocalization();
  const remaining = post.max_participants - post.participants_joined;
  const fillPct = Math.round((post.participants_joined / post.max_participants) * 100);

  const items = [
    { icon: Calendar, label: 'date', value: post.date },
    { icon: Clock, label: 'time', value: post.time },
    { icon: Timer, label: 'duration', value: post.estimated_duration },
    { icon: MapPin, label: 'location', value: post.location },
    { icon: Navigation, label: 'distance', value: post.distance },
    { icon: Users, label: 'participants', value: `${post.participants_joined} / ${post.max_participants}` },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 gap-2.5">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2.5 p-3 rounded-xl border border-border bg-card">
            <item.icon className="w-4 h-4 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground">{t(`nmoods.detail.${item.label}`)}</p>
              <p className="text-sm font-medium truncate">{item.value}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 p-3 rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">{t('nmoods.detail.spots_progress')}</span>
          <span className="text-xs font-semibold text-primary">{remaining} {t('nmoods.detail.remaining_spots')}</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-nmood-cta" style={{ width: `${fillPct}%` }} />
        </div>
      </div>
    </div>
  );
}