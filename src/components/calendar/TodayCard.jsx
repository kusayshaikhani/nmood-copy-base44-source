import React from 'react';
import { Calendar, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatDate, statusColors } from '@/lib/calendar-data';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function TodayCard({ activities, onDiscover, onActivityClick }) {
  const { t } = useLocalization();
  const todayStr = formatDate(new Date());
  const todayActivities = activities.filter((a) => a.date === todayStr);

  if (todayActivities.length === 0) {
    return (
      <Card className="p-5 mb-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-muted/60 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">{t('calendar.today.title')}</h3>
            <p className="text-xs text-muted-foreground">{t('calendar.today.nothing_planned')}</p>
          </div>
        </div>
        <Button size="sm" className="gap-2" onClick={onDiscover}>
          <Compass className="w-4 h-4" />{t('calendar.today.discover')}</Button>
      </Card>
    );
  }

  return (
    <Card className="p-4 mb-4">
      <h3 className="text-sm font-semibold mb-3">{t('calendar.today.todays_activities')}</h3>
      <div className="space-y-1">
        {todayActivities.map((a) => (
          <button
            key={a.id}
            onClick={() => onActivityClick(a)}
            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/40 transition-default text-start"
          >
            <div className={'w-1 h-10 rounded-full flex-shrink-0 ' + (statusColors[a.status]?.dot || 'bg-primary')} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{a.title}</p>
              <p className="text-xs text-muted-foreground truncate">{a.time} · {a.location}</p>
            </div>
            <span className="text-xs capitalize flex-shrink-0 px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {a.type}
            </span>
          </button>
        ))}
      </div>
    </Card>
  );
}