import React from 'react';
import { useLocalization } from '@/lib/i18n/useLocalization';

/**
 * HM-UX-001 — Shared Home widget shell. Consistent header (icon · title ·
 * optional subtitle) with a "See all" action, so every Home section follows the
 * same rhythm and can be reordered / toggled independently.
 */
export default function HomeWidget({ icon: Icon, title, subtitle, onSeeAll, onSeeAllLabel, children }) {
  const { t } = useLocalization();
  const seeAllLabel = onSeeAllLabel || t('common.see_all');
  return (
    <section>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold flex items-center gap-1.5">
            {Icon && <Icon className="w-4 h-4 text-primary flex-shrink-0" />}
            <span className="truncate">{title}</span>
          </h2>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        {onSeeAll && (
          <button
            onClick={onSeeAll}
            type="button"
            className="text-sm text-primary font-medium hover:underline flex-shrink-0"
          >
            {seeAllLabel}
          </button>
        )}
      </div>
      {children}
    </section>
  );
}