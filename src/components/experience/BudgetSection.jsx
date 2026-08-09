import React from 'react';
import { Wallet } from 'lucide-react';
import { getBudgetDetailLabel } from '@/lib/budget-utils';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function BudgetSection({ experience }) {
  const { t } = useLocalization();
  const label = getBudgetDetailLabel(experience);
  if (!label) return null;

  return (
    <div className="space-y-3">
      <h2 className="font-semibold text-lg">{t('experiences.confirm.expected_budget')}</h2>
      <div className="p-4 rounded-2xl border border-border bg-card">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Wallet className="w-5 h-5 text-primary" />
          </div>
          <p className="text-lg font-bold">{label}</p>
        </div>
        {label !== 'Free' && (
          <div className="pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('experiences.budget.each_own')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}