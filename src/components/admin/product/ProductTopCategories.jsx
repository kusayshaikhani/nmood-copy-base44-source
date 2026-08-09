import React from 'react';
import { Card } from '@/components/ui/card';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function ProductTopCategories({ items }) {
  const { t } = useLocalization();
  if (!items || items.length === 0) {
    return <Card className="p-5"><p className="text-sm text-muted-foreground">{t('admin.no_experience_categories_yet')}</p></Card>;
  }
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold mb-4">{t('admin.top_experience_categories')}</h3>
      <div className="space-y-2.5">
        {items.map((i) => (
          <div key={i.name} className="flex items-center gap-3">
            <span className="text-xs font-medium w-28 truncate flex-shrink-0">{i.name}</span>
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-primary" style={{ width: `${(i.count / max) * 100}%` }} />
            </div>
            <span className="text-xs font-semibold w-8 text-right">{i.count}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}