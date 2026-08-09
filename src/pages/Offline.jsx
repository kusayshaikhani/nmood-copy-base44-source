import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function Offline() {
  const { t } = useLocalization();
  const [reconnecting, setReconnecting] = useState(false);

  // Auto-recover the moment connectivity returns.
  useEffect(() => {
    const goOnline = () => window.location.reload();
    window.addEventListener('online', goOnline);
    return () => window.removeEventListener('online', goOnline);
  }, []);

  const handleRetry = () => {
    setReconnecting(true);
    if (navigator.onLine) {
      window.location.reload();
    } else {
      setTimeout(() => setReconnecting(false), 1500);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-warning/10 flex items-center justify-center mx-auto mb-6">
          <WifiOff className="w-8 h-8 text-warning" />
        </div>
        <h1 className="text-2xl font-bold mb-2">{t('offline.title')}</h1>
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
          {t('offline.description')}
        </p>
        <Button onClick={handleRetry} disabled={reconnecting} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${reconnecting ? 'animate-spin' : ''}`} />
          {reconnecting ? t('offline.reconnecting') : t('offline.retry')}
        </Button>
      </div>
    </div>
  );
}