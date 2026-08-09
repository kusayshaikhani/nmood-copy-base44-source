import React from 'react';
import { Search, X } from 'lucide-react';
import { useSettingsSearch } from './SettingsSearchContext';
import { useLocalization } from '@/lib/i18n/useLocalization';

/**
 * UI-022 — Sticky settings search bar. Filters rows instantly by title.
 * Sits below the hero and sticks to the top while scrolling.
 */
export default function SettingsSearchBar() {
  const { t } = useLocalization();
  const { searchTerm, setSearchTerm } = useSettingsSearch();

  return (
    <div className="sticky top-0 z-30 px-4 py-3 -mx-4 bg-background/80 backdrop-blur-xl border-b border-border/40">
      <div className="relative">
        <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t('settings.search.placeholder')}
          className="w-full h-11 ps-10 pe-10 rounded-button bg-card border border-border/70 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-default"
          aria-label={t('settings.search.placeholder')}
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="absolute end-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/70 transition-default"
            aria-label={t('common.close')}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}