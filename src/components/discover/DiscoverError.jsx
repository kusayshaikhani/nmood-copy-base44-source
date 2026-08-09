import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function DiscoverError({ onRetry }) {
  const { t } = useLocalization();
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-5">
        <AlertCircle className="w-8 h-8 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold mb-1.5">{t('discovery.error.title')}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        {t('discovery.error.desc')}
      </p>
      <Button onClick={onRetry} className="gap-2">
        <RefreshCw className="w-4 h-4" /> {t('discovery.error.retry')}
      </Button>
    </div>
  );
}