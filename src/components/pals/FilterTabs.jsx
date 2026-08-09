import React from 'react';
import { useLocalization } from '@/lib/i18n/useLocalization';

const FILTER_KEYS = [
  { key: 'all', labelKey: 'connections.filter.all' },
  { key: 'favorites', labelKey: 'connections.filter.favorites' },
  { key: 'recent', labelKey: 'connections.filter.recently_met' },
  { key: 'nearby', labelKey: 'connections.filter.nearby' },
  { key: 'online', labelKey: 'connections.filter.online' },
];

export default function FilterTabs({ active, onChange, counts = {} }) {
  const { t } = useLocalization();
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
      {FILTER_KEYS.map(f => (
        <button
          key={f.key}
          onClick={() => onChange(f.key)}
          type="button"
          className={`px-4 py-2 rounded-full text-sm font-medium flex-shrink-0 transition-default border ${
            active === f.key
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-card text-muted-foreground border-border hover:border-muted-foreground/30'
          }`}
        >
          {t(f.labelKey)}
          {counts[f.key] !== undefined && counts[f.key] > 0 && (
            <span className={`ms-1.5 ${active === f.key ? 'opacity-80' : 'opacity-60'}`}>{counts[f.key]}</span>
          )}
        </button>
      ))}
    </div>
  );
}