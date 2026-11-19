import React from 'react';
import { Check } from 'lucide-react';
import { PREMIUM_BENEFITS } from '@/lib/premium-benefits';

export default function PremiumBenefits() {
  const benefits = PREMIUM_BENEFITS.map(({ title, description }) => `${title}: ${description}`);

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