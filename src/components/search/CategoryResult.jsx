import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { categoryLabel } from '@/lib/i18n/label-resolvers';

export default function CategoryResult({ category }) {
  const { t } = useLocalization();
  const Icon = category.icon;
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:shadow-md transition-default cursor-pointer">
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold">{categoryLabel(t, category.name)}</h3>
        <p className="text-xs text-muted-foreground">{t('search.category.activities', { count: category.count })}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
    </div>
  );
}