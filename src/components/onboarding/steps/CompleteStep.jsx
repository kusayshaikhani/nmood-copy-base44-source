import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';
import { useLocalization } from '@/lib/i18n/useLocalization';
import BrandIcon from '@/components/brand/BrandIcon';

// UI-024 — Premium completion celebration. Confetti + logo bloom + CTA.
// onComplete / saving / error logic unchanged.
export default function CompleteStep({ data, onComplete, saving, error }) {
  const { t } = useLocalization();

  useEffect(() => {
    const colors = ['#6B52FF', '#AC5FDB', '#E3A2EE', '#4CAF50', '#FFB300'];
    confetti({ particleCount: 90, spread: 80, origin: { y: 0.45 }, colors });
    const timeout = setTimeout(() => {
      confetti({ particleCount: 55, angle: 60, spread: 60, origin: { x: 0 }, colors });
      confetti({ particleCount: 55, angle: 120, spread: 60, origin: { x: 1 }, colors });
    }, 220);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center text-center min-h-[72vh]">
      {/* success illustration */}
      <motion.div
        initial={{ scale: 0, rotate: -90, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 180, damping: 14, delay: 0.1 }}
        className="relative w-28 h-28 mb-8"
      >
        <div className="absolute inset-0 rounded-[2rem] bg-nmood-gradient shadow-2xl shadow-primary/30" />
        <div className="absolute inset-0 flex items-center justify-center">
          <BrandIcon size="lg" />
        </div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 300, damping: 18 }}
          className="absolute -top-2 -end-2 w-9 h-9 rounded-full bg-success flex items-center justify-center border-4 border-background shadow-lg"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </motion.div>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="font-heading text-[2rem] font-bold tracking-tight mb-3 text-balance"
      >
        {t('onboarding.complete.title')}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="text-muted-foreground text-[15px] leading-relaxed max-w-xs mb-9"
      >
        {data.display_name
          ? t('onboarding.complete.message_with_name', { name: data.display_name })
          : t('onboarding.complete.message')}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65, duration: 0.5 }}
        className="w-full max-w-xs"
      >
        {error && (
          <p className="text-sm text-destructive text-center mb-3">{error}</p>
        )}
        <Button className="w-full h-12 text-base shadow-elevated gap-1.5" onClick={onComplete} disabled={saving}>
          {saving ? (
            <><Loader2 className="w-5 h-5 animate-spin" />{t('onboarding.complete.setting_up')}</>
          ) : (
            t('onboarding.complete.cta')
          )}
        </Button>
      </motion.div>
    </div>
  );
}