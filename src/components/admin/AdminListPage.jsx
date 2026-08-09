import React, { useState, useMemo } from 'react';
import AdminTable from './AdminTable';
import { Search } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function AdminListPage({
  title, description, columns, data, actions,
  searchPlaceholder = 'Search...', searchKeys = [],
  filterOptions, filterKey, loading
}) {
  const { t } = useLocalization();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState(filterOptions?.[0]?.value || 'all');

  const filteredData = useMemo(() => {
    let result = data;
    if (search && searchKeys.length) {
      const q = search.toLowerCase();
      result = result.filter(row =>
        searchKeys.some(key => String(row[key] || '').toLowerCase().includes(q))
      );
    }
    if (filterOptions && filterKey && activeFilter !== 'all') {
      result = result.filter(row => row[filterKey] === activeFilter);
    }
    return result;
  }, [data, search, activeFilter, searchKeys, filterOptions, filterKey]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl font-bold">{title}</h1>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions}
      </div>

      {(searchKeys.length > 0 || filterOptions) && (
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          {searchKeys.length > 0 && (
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full h-9 pl-10 pr-4 text-sm rounded-lg bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 transition-default"
              />
            </div>
          )}
          {filterOptions && (
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
              {filterOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setActiveFilter(opt.value)}
                  className={'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-default ' +
                    (activeFilter === opt.value ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:bg-muted/50')}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border bg-card p-8 text-center">
          <div className="w-5 h-5 mx-auto border-2 border-muted border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground mt-3">{t('mission.loading')}</p>
        </div>
      ) : (
        <AdminTable columns={columns} data={filteredData} />
      )}
    </div>
  );
}