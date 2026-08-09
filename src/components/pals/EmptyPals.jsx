import React from 'react';
import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function EmptyPals({ onDiscover }) {
  const { t } = useLocalization();
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-5">
        <Users className="w-10 h-10 text-primary" strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-semibold mb-2 max-w-sm text-balance">{t('connections.empty.title')}</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs">
        {t('connections.empty.desc')}
      </p>
      <Button onClick={onDiscover} size="lg">{t('connections.action.discover')}</Button>
    </div>
  );
}