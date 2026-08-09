import React, { useState } from 'react';
import CalendarActivityCard from './CalendarActivityCard';
import { formatDate, formatDateLong, statusColors } from '@/lib/calendar-data';
import { useLocalization } from '@/lib/i18n/useLocalization';

const weekDayHeaders = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function MonthView({ activities, onActivityClick }) {
  const { t } = useLocalization();
  const today = new Date();
  const todayStr = formatDate(today);
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1);
  const firstDayOfWeek = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const monthLabel = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const selectedActivities = activities.filter((a) => a.date === selectedDate);

  return (
    <div>
      <h3 className="text-sm font-semibold mb-3 px-1">{monthLabel}</h3>

      <div className="grid grid-cols-7 gap-1 mb-4">
        {weekDayHeaders.map((d, i) => (
          <div key={i} className="text-center text-xs text-muted-foreground font-medium py-1">
            {d}
          </div>
        ))}
        {cells.map((cell, i) => {
          if (cell === null) return <div key={i} />;

          const dateStr = formatDate(new Date(year, month, cell));
          const dayActivities = activities.filter((a) => a.date === dateStr);
          const hasActivities = dayActivities.length > 0;
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;
          const cellClass = isSelected
            ? 'bg-primary/10 ring-1 ring-primary'
            : 'hover:bg-muted/40';

          return (
            <button
              key={i}
              onClick={() => setSelectedDate(dateStr)}
              className={'aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5 transition-default ' + cellClass}
            >
              <span className={'text-xs ' + (isToday ? 'text-primary font-bold' : '')}>
                {cell}
              </span>
              {hasActivities && (
                <div className="flex gap-0.5">
                  {dayActivities.slice(0, 3).map((a) => (
                    <div
                      key={a.id}
                      className={'w-1 h-1 rounded-full ' + (statusColors[a.status]?.dot || 'bg-primary')}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3 px-1">{formatDateLong(selectedDate)}</h3>
        {selectedActivities.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">{t('calendar.month.no_activities')}</p>
        ) : (
          <div className="space-y-3">
            {selectedActivities.map((a) => (
              <CalendarActivityCard key={a.id} activity={a} onClick={onActivityClick} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}