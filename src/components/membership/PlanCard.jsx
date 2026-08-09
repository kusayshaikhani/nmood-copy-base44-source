import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { getTier } from '@/lib/membership';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function PlanCard({ tierId, isCurrent, onSelect }) {
  const { t } = useLocalization();
  const tier = getTier(tierId);
  const cardClass = isCurrent
    ? 'border-primary ring-1 ring-primary'
    : '';

  return (
    <Card className={'p-5 ' + cardClass}>
      <div className="flex items-center justify-between mb-3">
        <div className={'w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ' + tier.bgColor + ' ' + tier.color}>
          {tier.badge}
        </div>
        {isCurrent && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-medium">
            {t('membership.current')}
          </span>
        )}
      </div>
      <h3 className="font-bold text-lg">{tier.name}</h3>
      <p className="text-sm text-muted-foreground mb-1">{tier.description}</p>
      <p className="text-2xl font-bold mb-3">{tier.price}</p>
      <ul className="space-y-1.5 mb-4">
        {tier.benefits.map((benefit) => (
          <li key={benefit} className="flex items-start gap-2 text-xs text-muted-foreground">
            <Check className="w-3.5 h-3.5 text-success flex-shrink-0 mt-0.5" />
            {benefit}
          </li>
        ))}
      </ul>
      {isCurrent ? (
        <Button className="w-full" variant="outline" disabled>
          {t('membership.current_plan')}
        </Button>
      ) : (
        <Button className="w-full" variant={tierId === 'vip' ? 'default' : 'outline'} onClick={() => onSelect && onSelect(tierId)}>
          {t('membership.choose_plan', { name: tier.name })}
        </Button>
      )}
    </Card>
  );
}