import React from 'react';
import { X, Clock } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function RecentSearches({ searches, onRemove, onClear, onSelect }) {
  const { t } = useLocalization();
  if (searches.length === 0) return null;
  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <h3 className="text-sm font-semibold flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
          {t('search.recent.title')}
        </h3>
        <button type="button" onClick={onClear} className="text-xs text-muted-foreground hover:text-foreground transition-default">
          {t('common.clear_all')}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {searches.map((s, i) => (
          <div key={i} className="flex items-center gap-1 pl-3 pr-1 py-1.5 rounded-full bg-muted">
            <button type="button" onClick={() => onSelect(s)} className="text-xs font-medium">{s}</button>
            <button type="button" onClick={() => onRemove(i)} className="w-5 h-5 rounded-full hover:bg-muted-foreground/20 flex items-center justify-center transition-default">
              <X className="w-3 h-3 text-muted-foreground" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}