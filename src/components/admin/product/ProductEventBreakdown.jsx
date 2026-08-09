import React from 'react';
import { Card } from '@/components/ui/card';
import { useLocalization } from '@/lib/i18n/useLocalization';

const CATEGORY_COLOR = {
  account: 'bg-primary',
  profile: 'bg-accent',
  discovery: 'bg-warning',
  connections: 'bg-success',
  experiences: 'bg-info',
  circles: 'bg-primary',
  membership: 'bg-warning',
};

export default function ProductEventBreakdown({ eventCounts }) {
  const { t } = useLocalization();
  if (!eventCounts || eventCounts.length === 0) {
    return <Card className="p-5"><p className="text-sm text-muted-foreground">{t('admin.no_product_events_recorded_yet')}</p></Card>;
  }
  const max = Math.max(...eventCounts.map((e) => e.count), 1);
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold mb-4">{t('admin.event_activity')}</h3>
      <div className="space-y-2 max-h-80 overflow-y-auto no-scrollbar">
        {eventCounts.map((e) => (
          <div key={e.name} className="flex items-center gap-3">
            <span className="text-xs font-medium w-44 truncate flex-shrink-0">{e.name}</span>
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full ${CATEGORY_COLOR.account}`}
                style={{ width: `${(e.count / max) * 100}%` }}
              />
            </div>
            <span className="text-xs font-semibold w-8 text-right">{e.count}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}