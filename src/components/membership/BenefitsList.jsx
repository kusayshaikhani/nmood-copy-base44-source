import React from 'react';
import { Check } from 'lucide-react';
import { getTier } from '@/lib/membership';

export default function BenefitsList({ tierId, compact = false }) {
  const tier = getTier(tierId);

  return (
    <ul className="space-y-1.5">
      {tier.benefits.map((benefit) => (
        <li key={benefit} className="flex items-start gap-2 text-xs text-muted-foreground">
          <Check className="w-3.5 h-3.5 text-success flex-shrink-0 mt-0.5" />
          {benefit}
        </li>
      ))}
    </ul>
  );
}