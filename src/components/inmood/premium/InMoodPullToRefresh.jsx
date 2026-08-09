import React, { useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import BrandLogo from '@/components/brand/BrandLogo';
import { useLocalization } from '@/lib/i18n/useLocalization';

const THRESHOLD = 70;

export default function InMoodPullToRefresh({ onRefresh, children }) {
  const { t } = useLocalization();
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);

  const onTouchStart = useCallback((e) => {
    if (window.scrollY <= 0 && !refreshing) {
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    }
  }, [refreshing]);

  const onTouchMove = useCallback((e) => {
    if (!pulling.current || refreshing) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0) setPull(Math.min(delta * 0.5, 90));
  }, [refreshing]);

  const onTouchEnd = useCallback(async () => {
    if (!pulling.current) return;
    pulling.current = false;
    if (pull >= THRESHOLD) {
      setRefreshing(true);
      setPull(THRESHOLD);
      try { await onRefresh(); } finally {
        setRefreshing(false);
        setPull(0);
      }
    } else {
      setPull(0);
    }
  }, [pull, onRefresh]);

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{ touchAction: 'pan-y' }}
    >
      <div className="relative overflow-hidden" style={{ height: pull }}>
        <motion.div
          animate={{ opacity: pull > 10 ? 1 : 0 }}
          className="absolute inset-0 flex flex-col items-center justify-center gap-1"
        >
          {refreshing ? (
            <>
              <div className="animate-spin"><BrandLogo size="sm" /></div>
              <span className="text-xs text-muted-foreground font-medium">{t('inmood.intel.refreshing')}</span>
            </>
          ) : (
            <div className="opacity-60"><BrandLogo size="sm" /></div>
          )}
        </motion.div>
      </div>
      {children}
    </div>
  );
}