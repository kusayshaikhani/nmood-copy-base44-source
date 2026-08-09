import React, { useMemo, useState } from 'react';
import { Search, Check, X } from 'lucide-react';
import { searchMaster, masterLabel, masterList, INTEREST_CATEGORIES } from '@/lib/master-data';
import { useLocalization } from '@/lib/i18n/useLocalization';

// Reusable master-data picker.
// type: 'countries' | 'languages' | 'interests' | 'experienceTypes' | 'personalityTraits' | 'lifeGoals'
// value: array of keys (multi) or single key (single). onChange returns the same shape.
export default function MasterDataPicker({
  type,
  value,
  onChange,
  multi = true,
  searchable = true,
  placeholder = 'Search…',
  max = null,
  showCounts = false,
}) {
  const { t } = useLocalization();
  const [query, setQuery] = useState('');
  const selectedKeys = useMemo(
    () => new Set(multi ? (Array.isArray(value) ? value : []) : value ? [value] : []),
    [value, multi]
  );
  const flat = useMemo(() => (query ? searchMaster(type, query) : masterList(type, t)), [type, query, t]);

  const toggle = (key) => {
    if (multi) {
      if (selectedKeys.has(key)) onChange((value || []).filter((k) => k !== key));
      else if (!max || selectedKeys.size < max) onChange([...(value || []), key]);
    } else {
      onChange(selectedKeys.has(key) ? '' : key);
    }
  };

  const isCategorized = type === 'interests' && !query;

  const renderRow = (item) => {
    const selected = selectedKeys.has(item.key);
    const label = masterLabel(type, item.key, t);
    const sub = item.native && item.native !== label ? item.native : null;
    return (
      <button
        key={item.key}
        type="button"
        onClick={() => toggle(item.key)}
        className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border transition-default text-start ${
          selected ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
        }`}
      >
        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${selected ? 'border-primary bg-primary' : 'border-muted-foreground/30'}`}>
          {selected && <Check className="w-3.5 h-3.5 text-primary-foreground" strokeWidth={3} />}
        </div>
        {item.flag && <span className="text-lg leading-none flex-shrink-0">{item.flag}</span>}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-tight truncate">{label}</p>
          {sub && <p className="text-xs text-muted-foreground truncate">{sub}</p>}
        </div>
        {item.dialing && <span className="text-xs text-muted-foreground flex-shrink-0">{item.dialing}</span>}
      </button>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {searchable && (
        <div className="relative mb-3">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="w-full ps-9 pe-3 py-2.5 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} className="absolute end-2.5 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {multi && max && (
        <p className="text-xs text-muted-foreground mb-2">
          {selectedKeys.size}/{max} selected
        </p>
      )}

      <div className="flex-1 overflow-y-auto no-scrollbar momentum-scroll space-y-1.5 pe-1">
        {isCategorized ? (
          INTEREST_CATEGORIES.map((cat) => {
            const items = cat.interests.map((i) => ({ ...i, category: cat.key }));
            return (
              <div key={cat.key} className="mb-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground px-1 mb-1.5">{cat.label}</p>
                <div className="space-y-1.5">{items.map(renderRow)}</div>
              </div>
            );
          })
        ) : flat.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No matches found.</p>
        ) : (
          flat.map(renderRow)
        )}
      </div>
    </div>
  );
}