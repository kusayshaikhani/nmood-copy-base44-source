import React from 'react';
import { Check, X } from 'lucide-react';
import { TIER_ORDER, MEMBERSHIP_TIERS, comparisonRows } from '@/lib/membership';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function ComparisonTable({ currentTier }) {
  const { t } = useLocalization();
  return (
    <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
      <table className="w-full min-w-[520px] border-collapse">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left text-xs font-semibold text-muted-foreground py-2.5 pe-3">{t('membership.feature')}</th>
            {TIER_ORDER.map((t2) => {
              const tier = MEMBERSHIP_TIERS[t2];
              const isCurrent = t2 === currentTier;
              return (
                <th
                  key={t2}
                  className={'text-center text-xs font-semibold py-2.5 px-2 ' + (isCurrent ? 'text-primary' : 'text-muted-foreground')}
                >
                  {tier.name}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {comparisonRows.map((row, i) => (
            <tr key={row.label} className={i % 2 === 0 ? 'bg-muted/20' : ''}>
              <td className="text-xs text-muted-foreground py-2.5 pe-3">{row.label}</td>
              {TIER_ORDER.map((t2) => {
                const value = row.values[t2];
                const isCurrent = t2 === currentTier;
                return (
                  <td key={t2} className={'text-center py-2.5 px-2 ' + (isCurrent ? 'bg-primary/5' : '')}>
                    {typeof value === 'boolean' ? (
                      value ? (
                        <Check className="w-4 h-4 text-success mx-auto" />
                      ) : (
                        <X className="w-4 h-4 text-muted-foreground/30 mx-auto" />
                      )
                    ) : (
                      <span className="text-xs font-medium">{value}</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}