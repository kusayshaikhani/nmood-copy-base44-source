import React from 'react';
import { Search, X } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function SearchBar({ value, onChange, onSubmit, onClear }) {
  const { t } = useLocalization();
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('search.placeholder')}
        className="w-full h-14 pl-12 pr-12 text-base rounded-input bg-muted border border-transparent focus:border-border focus:bg-card focus:outline-none transition-default"
        autoFocus
      />
      {value && (
        <button type="button" onClick={onClear} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted-foreground/10 transition-default">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      )}
    </form>
  );
}