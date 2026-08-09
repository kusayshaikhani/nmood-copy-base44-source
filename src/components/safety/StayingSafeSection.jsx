import React from 'react';
import { Card } from '@/components/ui/card';
import { safetyTips } from '@/lib/safety-data';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function StayingSafeSection() {
  const { t } = useLocalization();
  return (
    <section className="mb-6">
      <h2 className="text-base font-semibold mb-3">{t('safety.staying_safe.title')}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {safetyTips.map((tip) => {
          const Icon = tip.icon;
          return (
            <Card key={tip.title} className="p-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-2.5">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-sm mb-1">{tip.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{tip.description}</p>
            </Card>
          );
        })}
      </div>
    </section>
  );
}