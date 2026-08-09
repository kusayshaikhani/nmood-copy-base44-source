import React from 'react';
import { SearchX, Compass, Heart, Clock } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function SearchEmpty({ query }) {
  const { t } = useLocalization();
  // BUG-010 — Contextual guidance instead of a bare "No results".
  const hints = [
    { icon: Compass, label: t('search.empty.hint_broaden') },
    { icon: Heart, label: t('search.empty.hint_interests') },
    { icon: Clock, label: t('search.empty.hint_later') },
  ];
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
        <SearchX className="w-8 h-8 text-muted-foreground" />
      </div>
      <p className="text-sm font-semibold mb-1">{t('search.empty.title')}</p>
      <p className="text-xs text-muted-foreground mb-4">
        {query ? t('search.empty.desc_with_query', { query }) : t('search.empty.desc')}
      </p>
      <div className="flex flex-col gap-2 max-w-xs mx-auto">
        {hints.map((hint) => {
          const Icon = hint.icon;
          return (
            <div key={hint.label} className="flex items-center gap-2 text-xs text-muted-foreground p-2 rounded-xl border border-border bg-card/50">
              <Icon className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <span>{hint.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}