import React from 'react';
import { Check } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function PremiumBenefits() {
  const { t } = useLocalization();
  const benefits = [
    t('membership.benefit.unlimited_connections'),
    t('membership.benefit.unlimited_experiences'),
    t('membership.benefit.unlimited_circles'),
    t('membership.benefit.profile_views'),
    t('membership.benefit.private_messaging'),
    t('membership.benefit.priority_visibility'),
    t('membership.benefit.advanced_filters'),
    t('membership.benefit.future_premium'),
  ];

  return (
    <ul className="space-y-1.5">
      {benefits.map((b) => (
        <li key={b} className="flex items-start gap-2 text-sm">
          <Check className="w-4 h-4 text-success flex-shrink-0 mt-0.5" /> {b}
        </li>
      ))}
    </ul>
  );
}