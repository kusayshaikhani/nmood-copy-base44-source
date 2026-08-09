import React from 'react';
import { Info, Check } from 'lucide-react';
import { budgetOptions } from '@/lib/budget-utils';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function StepBudget({ data, update, errors = {} }) {
  const { t } = useLocalization();
  const selected = data.budgetOption || '';
  const isCustom = selected === 'custom';
  const inputClass = 'w-full h-12 px-3.5 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-default';

  const optionClass = (sel) =>
    'w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-start transition-default ' +
    (sel ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/30');

  return (
    <div className="space-y-5">
      <div className="text-center mb-2">
        <h2 className="text-lg font-semibold">{t('experiences.confirm.expected_budget')}</h2>
        <p className="text-sm text-muted-foreground">
          {t('hosting.step.budget_help')}
        </p>
      </div>

      <p className="text-sm font-medium">{t('hosting.step.budget_question')}</p>

      <div className="space-y-2.5">
        {budgetOptions.map((opt) => (
          <button
            key={opt.id}
            onClick={() => update('budgetOption', opt.id)}
            type="button"
            className={optionClass(selected === opt.id)}
          >
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                selected === opt.id ? 'border-primary' : 'border-muted-foreground/30'
              }`}
            >
              {selected === opt.id && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
            </div>
            <span className={`text-sm ${selected === opt.id ? 'font-semibold text-primary' : 'font-medium'}`}>
              {opt.label}
            </span>
            {selected === opt.id && <Check className="w-4 h-4 text-primary ml-auto" />}
          </button>
        ))}
      </div>

      {errors.budgetOption && (
        <p className="text-xs text-destructive text-center">{errors.budgetOption}</p>
      )}

      {isCustom && (
        <div className="space-y-3 p-4 rounded-2xl border border-border bg-muted/30">
          <p className="text-sm font-semibold">{t('experiences.confirm.expected_budget')}</p>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">{t('hosting.step.currency')}</label>
            <div className="h-12 px-3.5 rounded-xl bg-muted border border-border text-sm flex items-center font-medium">
              {t('hosting.step.currency_aed')}
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">{t('hosting.step.amount')}</label>
            <input
              type="number"
              min="1"
              value={data.customAmount || ''}
              onChange={(e) => update('customAmount', e.target.value)}
              placeholder={t('hosting.step_budget.enter_amount')}
              className={inputClass}
            />
            {errors.customAmount && (
              <p className="text-xs text-destructive mt-1">{errors.customAmount}</p>
            )}
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">{t('hosting.step_budget.type')}</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => update('budgetType', 'estimated')}
                type="button"
                className={`h-11 rounded-xl border-2 text-sm font-medium transition-default ${
                  (data.budgetType || 'estimated') === 'estimated'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border'
                }`}
              >
                Estimated
              </button>
              <button
                onClick={() => update('budgetType', 'fixed')}
                type="button"
                className={`h-11 rounded-xl border-2 text-sm font-medium transition-default ${
                  data.budgetType === 'fixed' ? 'border-primary bg-primary/5 text-primary' : 'border-border'
                }`}
              >
                Fixed
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-muted/30 border border-border">
        <Info className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t('circles.about.budget_each_own')}
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t('circles.about.budget_no_payment')}
          </p>
        </div>
      </div>
    </div>
  );
}