import React, { useState } from 'react';
import CalendarActivityCard from './CalendarActivityCard';
import { formatDate } from '@/lib/calendar-data';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function DayView({ activities, onActivityClick }) {
  const { t } = useLocalization();
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(formatDate(today));
  const todayStr = formatDate(today);

  const changeDay = (offset) => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + offset);
    setSelectedDate(formatDate(d));
  };

  const dayActivities = activities
    .filter((a) => a.date === selectedDate)
    .sort((a, b) => a.time.localeCompare(b.time));

  const dateObj = new Date(selectedDate + 'T00:00:00');
  const dateLabel = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  const isToday = selectedDate === todayStr;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => changeDay(-1)}
          className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/70 transition-default"
        >
          ‹
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold">{dateLabel}</p>
          {isToday && <p className="text-xs text-primary">{t('calendar.today.title')}</p>}
        </div>
        <button
          type="button"
          onClick={() => changeDay(1)}
          className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/70 transition-default"
        >
          ›
        </button>
      </div>

      {dayActivities.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground">{t('calendar.day.nothing_planned')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {dayActivities.map((a) => (
            <CalendarActivityCard key={a.id} activity={a} onClick={onActivityClick} />
          ))}
        </div>
      )}
    </div>
  );
}