import React from 'react';
import { Card } from '@/components/ui/card';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function ProductPopularInterests({ items }) {
  const { t } = useLocalization();
  if (!items || items.length === 0) {
    return <Card className="p-5"><p className="text-sm text-muted-foreground">{t('admin.no_interest_data_yet')}</p></Card>;
  }
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold mb-4">{t('admin.most_popular_interests')}</h3>
      <div className="flex flex-wrap gap-2">
        {items.map((i) => {
          const scale = Math.min(1, 0.7 + (i.count / (items[0].count || 1)) * 0.3);
          return (
            <span
              key={i.name}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium"
              style={{ fontSize: `${scale}rem` }}
            >
              {i.name}
              <span className="text-[10px] text-primary/60 font-semibold">{i.count}</span>
            </span>
          );
        })}
      </div>
    </Card>
  );
}