import React from 'react';
import { Check, Minus } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

// UI-023 — Modern Explorer vs Premium comparison with checkmarks.
const ROWS = [
  { key: 'connections', explorer: 'val.limited', premium: 'val.unlimited' },
  { key: 'messaging', explorer: 'val.pals_only', premium: 'val.unlimited' },
  { key: 'discovery', explorer: 'val.standard', premium: 'val.priority' },
  { key: 'experiences', explorer: 'val.limited', premium: 'val.unlimited' },
  { key: 'circles', explorer: 'val.limited', premium: 'val.unlimited' },
  { key: 'ai', explorer: 'val.basic', premium: 'val.advanced' },
  { key: 'visibility', explorer: false, premium: true },
  { key: 'support', explorer: 'val.standard', premium: 'val.priority' },
  { key: 'verification', explorer: false, premium: true },
  { key: 'insights', explorer: false, premium: true },
  { key: 'future', explorer: false, premium: true },
];

export default function PremiumComparison({ currentTier }) {
  const { t } = useLocalization();
  const isExplorer = currentTier === 'explorer';

  const renderCell = (value, isPremiumCol) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="w-[18px] h-[18px] text-success mx-auto" strokeWidth={2.5} />
      ) : (
        <Minus className="w-[18px] h-[18px] text-muted-foreground/40 mx-auto" strokeWidth={2} />
      );
    }
    return (
      <span
        className={`text-[12.5px] font-medium ${isPremiumCol ? 'text-foreground' : 'text-muted-foreground'}`}
      >
        {t(`membership.premium.${value}`)}
      </span>
    );
  };

  return (
    <div>
      <div className="px-1 mb-4">
        <h2 className="font-heading text-xl font-bold tracking-tight">{t('membership.premium.comparison_title')}</h2>
        <p className="text-[13px] text-muted-foreground mt-0.5">{t('membership.premium.comparison_subtitle')}</p>
      </div>

      <div className="rounded-card border border-border/50 bg-card shadow-card overflow-hidden">
        {/* header */}
        <div className="grid grid-cols-[1.4fr_1fr_1fr] sticky top-0 bg-card/95 backdrop-blur-sm">
          <div className="px-4 py-3.5" />
          <div className={`px-2 py-3.5 text-center ${isExplorer ? 'bg-primary/5' : ''}`}>
            <p className={`text-[13px] font-bold ${isExplorer ? 'text-primary' : 'text-muted-foreground'}`}>
              {t('membership.premium.col_explorer')}
            </p>
          </div>
          <div className={`px-2 py-3.5 text-center bg-nmood-gradient text-primary-foreground ${!isExplorer ? 'ring-2 ring-primary ring-inset' : ''}`}>
            <p className="text-[13px] font-bold">{t('membership.premium.col_premium')}</p>
          </div>
        </div>

        {ROWS.map((row, i) => (
          <div
            key={row.key}
            className={`grid grid-cols-[1.4fr_1fr_1fr] items-center ${i % 2 === 0 ? 'bg-muted/25' : ''}`}
          >
            <div className="px-4 py-3 text-[13px] font-medium text-foreground/90">
              {t(`membership.premium.row.${row.key}`)}
            </div>
            <div className="px-2 py-3 text-center">{renderCell(row.explorer, false)}</div>
            <div className="px-2 py-3 text-center bg-primary/5">{renderCell(row.premium, true)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}