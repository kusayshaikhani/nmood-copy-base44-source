import React from 'react';
import { Plus, SlidersHorizontal, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function HostHeader({ search, setSearch, onFilterClick, onCreate, hasFilters }) {
  const { t } = useLocalization();
  return (
    <div className="mb-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">{t('hosting.dashboard.title')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t('hosting.dashboard.subtitle')}
          </p>
        </div>
        <Button onClick={onCreate} className="gap-2 flex-shrink-0">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">{t('hosting.dashboard.create')}</span>
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('hosting.dashboard.search')}
            className="w-full h-10 ps-10 pe-10 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-default"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute end-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={onFilterClick}
          className="relative flex-shrink-0"
        >
          <SlidersHorizontal className="w-4 h-4" />
          {hasFilters && (
            <div className="absolute top-1.5 end-1.5 w-2 h-2 bg-primary rounded-full" />
          )}
        </Button>
      </div>
    </div>
  );
}