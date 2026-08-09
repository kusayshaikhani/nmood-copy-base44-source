import React from 'react';
import { Check, Lock, Sparkles } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

// MP-001 — Explorer vs Premium side-by-side comparison.
// Uses Release 1.0 membership rules (permission-engine.js).

export default function PremiumComparisonTable({ currentTier }) {
  const { t } = useLocalization();

  const explorerBullets = [
    t('membership.compare.explorer_requests'),
    t('membership.compare.explorer_circles'),
    t('membership.compare.explorer_experiences'),
    t('membership.compare.explorer_recommendations'),
    t('membership.compare.explorer_support'),
  ];

  const premiumBullets = [
    t('membership.compare.premium_requests'),
    t('membership.compare.premium_circles'),
    t('membership.compare.premium_experiences'),
    t('membership.compare.premium_recommendations'),
    t('membership.compare.premium_badge'),
    t('membership.compare.premium_support'),
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {/* Explorer */}
      <div
        className={
          'rounded-xl border p-5 ' +
          (currentTier === 'explorer' ? 'border-primary bg-primary/5' : 'border-border bg-card')
        }
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
            <Lock className="w-4 h-4 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-sm">{t('membership.explorer')}</h3>
        </div>
        <ul className="space-y-2">
          {explorerBullets.map((b) => (
            <li key={b} className="flex items-start gap-2 text-xs text-muted-foreground">
              <span className="w-1 h-1 rounded-full bg-muted-foreground/50 flex-shrink-0 mt-1.5" />
              {b}
            </li>
          ))}
        </ul>
      </div>

      {/* Premium */}
      <div
        className={
          'rounded-xl border p-5 ' +
          (currentTier === 'premium'
            ? 'border-primary bg-primary/5'
            : 'border-primary/30 bg-primary/5')
        }
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-semibold text-sm text-primary">{t('membership.premium')}</h3>
        </div>
        <ul className="space-y-2">
          {premiumBullets.map((b) => (
            <li key={b} className="flex items-start gap-2 text-xs">
              <Check className="w-3.5 h-3.5 text-success flex-shrink-0 mt-0.5" />
              {b}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}