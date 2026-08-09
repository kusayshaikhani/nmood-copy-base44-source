import React from 'react';
import { formatDate, getStartOfWeek, statusColors } from '@/lib/calendar-data';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function WeekView({ activities, onActivityClick }) {
  const { t } = useLocalization();
  const today = new Date();
  const todayStr = formatDate(today);
  const startOfWeek = getStartOfWeek(today);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  return (
    <div className="space-y-3">
      {weekDays.map((day) => {
        const dayStr = formatDate(day);
        const dayActivities = activities.filter((a) => a.date === dayStr);
        const isToday = dayStr === todayStr;
        const dayName = day.toLocaleDateString('en-US', { weekday: 'short' });

        return (
          <div key={dayStr}>
            <div className="flex items-center gap-2 mb-2 px-1">
              <span className="text-sm font-medium">{dayName}</span>
              <span className={'text-sm ' + (isToday ? 'text-primary font-bold' : 'text-muted-foreground')}>
                {day.getDate()}
              </span>
              {isToday && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  {t('calendar.today.title')}
                </span>
              )}
              {dayActivities.length > 0 && (
                <span className="text-xs text-muted-foreground ml-auto">{dayActivities.length}</span>
              )}
            </div>
            {dayActivities.length > 0 ? (
              <div className="space-y-2 ps-3 border-s-2 border-border">
                {dayActivities.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => onActivityClick(a)}
                    className="w-full flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/40 hover:bg-muted/70 transition-default text-start"
                  >
                    <div className={'w-1 h-8 rounded-full flex-shrink-0 ' + (statusColors[a.status]?.dot || 'bg-primary')} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{a.title}</p>
                      <p className="text-xs text-muted-foreground">{a.time}</p>
                    </div>
                    <span className="text-xs capitalize text-muted-foreground flex-shrink-0">{a.type}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="ps-3 border-s-2 border-border">
                <p className="text-xs text-muted-foreground py-1.5">{t('calendar.empty.no_activities')}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}