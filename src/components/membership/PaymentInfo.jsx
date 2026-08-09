import React from 'react';
import { Check } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

// MP-001 — Payment information / trust signals for App Store & Google Play.

export default function PaymentInfo() {
  const { t } = useLocalization();
  const items = [
    t('membership.payment_secure'),
    t('membership.payment_protected'),
    t('membership.payment_renewal'),
    t('membership.payment_manage'),
  ];

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2 text-xs text-muted-foreground">
          <Check className="w-3.5 h-3.5 text-success flex-shrink-0 mt-0.5" />
          {item}
        </li>
      ))}
    </ul>
  );
}