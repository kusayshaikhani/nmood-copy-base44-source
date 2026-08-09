import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { WifiOff, RefreshCw, CloudUpload } from 'lucide-react';
import { useOnlineStatus } from '@/lib/useOnlineStatus';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { haptic } from '@/lib/haptics';

/**
 * UI-026 — Premium offline banner. Appears the moment connectivity drops,
 * does NOT block browsing of cached content, and when the connection
 * returns shows a subtle "syncing" pulse before auto-hiding.
 */
export default function OfflineBanner() {
  const online = useOnlineStatus();
  const { t } = useLocalization();
  const [reconnecting, setReconnecting] = useState(false);
  const [showSync, setShowSync] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  // Track transitions: when we come back online, flash a brief sync state.
  useEffect(() => {
    if (!online) {
      setWasOffline(true);
    } else if (wasOffline) {
      setShowSync(true);
      const tmr = setTimeout(() => {
        setShowSync(false);
        setWasOffline(false);
      }, 1800);
      return () => clearTimeout(tmr);
    }
  }, [online, wasOffline]);

  const handleRetry = () => {
    haptic('light');
    setReconnecting(true);
    if (navigator.onLine) window.location.reload();
    else setTimeout(() => setReconnecting(false), 1500);
  };

  return (
    <AnimatePresence>
      {(!online || showSync) && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          className="sticky top-0 z-50 mx-auto max-w-5xl bg-gradient-to-r from-primary/15 via-accent/15 to-primary/15 border-b border-primary/25 backdrop-blur-xl"
          role="alert"
          aria-live="assertive"
        >
          <div className="flex items-center gap-3 px-4 py-2.5">
            {showSync ? (
              <CloudUpload className="w-4 h-4 text-primary flex-shrink-0 animate-pulse" />
            ) : (
              <WifiOff className="w-4 h-4 text-primary flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">
                {showSync ? t('ux.offline_reconnecting') : t('ux.offline_title')}
              </p>
              <p className="text-xs text-muted-foreground">{t('ux.offline_desc')}</p>
            </div>
            {!showSync && (
              <button type="button" onClick={handleRetry} className="flex items-center gap-1.5 text-xs font-medium text-primary whitespace-nowrap">
                <RefreshCw className={`w-3.5 h-3.5 ${reconnecting ? 'animate-spin' : ''}`} />
                {t('ux.offline_retry')}
              </button>
            )}
          </div>
          {showSync && (
            <div className="h-0.5 w-full bg-primary/20 overflow-hidden">
              <motion.div
                className="h-full bg-primary"
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ duration: 1.2, ease: 'easeInOut' }}
              />
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}