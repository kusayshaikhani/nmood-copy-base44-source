import React from 'react';
import { TrendingUp } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function TrendingSearches({ items, onSelect }) {
  const { t } = useLocalization();
  return (
    <div>
      <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-2.5">
        <TrendingUp className="w-3.5 h-3.5 text-primary" />
        {t('search.trending.title')}
      </h3>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onSelect(item)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/5 text-primary text-xs font-medium hover:bg-primary/10 transition-default"
          >
            <TrendingUp className="w-3 h-3" />
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}