import React from 'react';
import { motion } from 'framer-motion';
import { useLocalization } from '@/lib/i18n/useLocalization';

/**
 * UI-004 Phase 6 — Contextual smart greeting based on device time.
 * Morning (05–12) / Afternoon (12–18) / Evening (18–05).
 * Updates automatically — no API calls, pure client-side time check.
 */
function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  return 'evening';
}

export default function SmartGreeting() {
  const { t } = useLocalization();
  const tod = getTimeOfDay();
  const emoji = tod === 'morning' ? '☀️' : tod === 'afternoon' ? '🌤️' : '🌙';

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="text-[2rem] leading-none mb-7"
      >
        {emoji}
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="text-white text-[2rem] font-bold tracking-tight leading-none"
      >
        {t(`discovery.greeting.${tod}`)}
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.4 }}
        className="mt-2 text-white/80 text-sm font-medium"
      >
        {t(`discovery.greeting.${tod}_subtitle`)}
      </motion.p>
    </div>
  );
}