import React from 'react';
import { Search, X } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function InMoodFeedSearch({ value, onChange }) {
  const { t } = useLocalization();
  return (
    <div className="relative">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('inmood.intel.search_placeholder')}
        className="w-full h-12 pl-11 pr-10 rounded-button bg-card border border-border/40 text-sm font-medium placeholder:text-muted-foreground/70 focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-[border-color,box-shadow] duration-200"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full hover:bg-muted flex items-center justify-center"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}