import React from 'react';
import { Check } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

// MP-001 — "Why members choose Premium" value section.

export default function WhyUpgrade() {
  const { t } = useLocalization();
  const reasons = [
    t('membership.why_upgrade.meet_more'),
    t('membership.why_upgrade.unlimited_experiences'),
    t('membership.why_upgrade.unlimited_circles'),
    t('membership.why_upgrade.ai_recommendations'),
    t('membership.why_upgrade.complete_experience'),
  ];

  return (
    <div>
      <h2 className="text-sm font-semibold text-center mb-3">{t('membership.why_upgrade_title')}</h2>
      <ul className="space-y-2">
        {reasons.map((r) => (
          <li key={r} className="flex items-start gap-2 text-sm">
            <Check className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
            {r}
          </li>
        ))}
      </ul>
    </div>
  );
}