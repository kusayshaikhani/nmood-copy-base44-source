import React from 'react';
import { Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function EmptyActivities({ onDiscover }) {
  const { t } = useLocalization();
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="relative mb-6">
        <div className="w-28 h-28 rounded-full bg-primary/10 flex items-center justify-center">
          <Compass className="w-12 h-12 text-primary" strokeWidth={1.5} />
        </div>
        <div className="absolute -bottom-1 -end-1 w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-accent" />
        </div>
      </div>
      <h3 className="text-lg font-semibold mb-2 max-w-sm text-balance">{t('my_activities.empty_nearby')}</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs">
        {t('my_activities.empty_create')}
      </p>
      <Button onClick={onDiscover} size="lg">{t('connections.action.discover')}</Button>
    </div>
  );
}