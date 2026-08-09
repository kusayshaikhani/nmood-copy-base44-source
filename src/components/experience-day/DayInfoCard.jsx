import React from 'react';
import { Calendar, Clock, Sun, Wallet, MapPin, Users } from 'lucide-react';
import { getBudgetDetailLabel } from '@/lib/budget-utils';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function DayInfoCard({ experience }) {
  const { t } = useLocalization();
  const budgetLabel = getBudgetDetailLabel(experience);
  const items = [
    { icon: Calendar, label: 'Date', value: experience.date },
    { icon: Clock, label: 'Time', value: experience.time },
    { icon: Sun, label: 'Weather', value: 'Sunny · 28°C' },
    { icon: Wallet, label: 'Budget', value: budgetLabel || '—' },
    { icon: MapPin, label: 'Location', value: experience.venue?.name },
    { icon: Users, label: 'Participants', value: `${experience.spotsFilled} going` },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <h2 className="font-semibold text-sm">{t('experiences.detail.title')}</h2>
      <div className="grid grid-cols-2 gap-3">
        {items.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-start gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground">{label}</p>
              <p className="text-xs font-medium truncate">{value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}