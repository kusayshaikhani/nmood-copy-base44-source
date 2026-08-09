import React from 'react';
import { Bell } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

/**
 * UI-007 — Modern empty state with gradient glow + ringed icon.
 */
export default function NotificationsEmpty() {
  const { t } = useLocalization();
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="relative w-24 h-24 mb-5">
        <div className="absolute inset-0 rounded-full bg-nmood-gradient opacity-15 blur-xl" />
        <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-primary/10 to-accent/15 flex items-center justify-center ring-1 ring-primary/10">
          <Bell className="w-10 h-10 text-primary/50" strokeWidth={1.5} />
        </div>
      </div>
      <h3 className="text-lg font-bold mb-1.5">{t('notifications.empty.title')}</h3>
      <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
        {t('notifications.empty.desc')}
      </p>
    </div>
  );
}