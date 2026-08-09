import React from 'react';
import { CalendarDays, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function CalendarEmptyState({ onDiscover }) {
  const { t } = useLocalization();
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mb-4">
        <CalendarDays className="w-10 h-10 text-primary/40" strokeWidth={1.5} />
      </div>
      <h3 className="text-base font-semibold mb-1">{t('calendar.empty.title')}</h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-5">
        {t('calendar.empty.desc')}
      </p>
      <Button className="gap-2" onClick={onDiscover}>
        <Compass className="w-4 h-4" />{t('calendar.today.discover')}</Button>
    </div>
  );
}