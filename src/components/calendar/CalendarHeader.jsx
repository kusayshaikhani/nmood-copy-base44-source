import React from 'react';
import { RefreshCw, Bell } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function CalendarHeader({ view, onViewChange, onOpenSync, onOpenReminders }) {
  const { t } = useLocalization();
  const views = [
    { id: 'day', label: 'Day' },
    { id: 'week', label: 'Week' },
    { id: 'month', label: 'Month' },
    { id: 'agenda', label: 'Agenda' },
  ];

  return (
    <div className="mb-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h1 className="text-2xl font-bold">{t('calendar.header.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('calendar.header.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onOpenSync}
            className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/70 transition-default"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onOpenReminders}
            className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/70 transition-default"
          >
            <Bell className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="flex gap-1 p-1 rounded-xl bg-muted/50">
        {views.map((v) => {
          const isActive = view === v.id;
          const btnClass = isActive
            ? 'bg-card shadow-sm text-primary'
            : 'text-muted-foreground';
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => onViewChange(v.id)}
              className={'flex-1 py-2 rounded-lg text-sm font-medium transition-default ' + btnClass}
            >
              {v.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}