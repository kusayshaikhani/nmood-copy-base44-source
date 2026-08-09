import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function MessagesEmpty() {
  const { t } = useLocalization();
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mb-4">
        <MessageCircle className="w-10 h-10 text-primary/40" strokeWidth={1.5} />
      </div>
      <h3 className="text-base font-semibold mb-1">{t('messaging.empty.title')}</h3>
      <p className="text-sm text-muted-foreground max-w-xs">
        {t('messaging.empty.desc')}
      </p>
    </div>
  );
}