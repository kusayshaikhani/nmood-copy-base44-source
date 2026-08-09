import React from 'react';
import { motion } from 'framer-motion';
import { Crown } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

// UI-023 — Large premium gradient hero (purple → indigo).
export default function PremiumHero() {
  const { t } = useLocalization();
  const lines = [
    t('membership.premium.hero_line_1'),
    t('membership.premium.hero_line_2'),
    t('membership.premium.hero_line_3'),
  ];
  return (
    <div className="relative overflow-hidden rounded-card bg-nmood-gradient shadow-elevated">
      {/* soft glow accents */}
      <div className="absolute -top-16 -end-16 w-48 h-48 rounded-full bg-white/20 blur-3xl" />
      <div className="absolute -bottom-20 -start-10 w-40 h-40 rounded-full bg-accent/30 blur-3xl" />
      <div className="absolute inset-0 premium-shimmer opacity-30" />

      <div className="relative px-7 pt-10 pb-9 text-center text-primary-foreground">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18 }}
          className="w-20 h-20 mx-auto mb-5 rounded-3xl bg-white/15 backdrop-blur-md flex items-center justify-center shadow-lg ring-1 ring-white/30"
        >
          <Crown className="w-10 h-10 text-white" strokeWidth={1.75} />
        </motion.div>

        <motion.h1
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.08, duration: 0.4 }}
          className="font-heading text-[1.75rem] leading-[1.15] font-bold tracking-tight text-balance"
        >
          {t('membership.premium.hero_title')}
        </motion.h1>

        <div className="mt-3 space-y-0.5">
          {lines.map((l, i) => (
            <motion.p
              key={l}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.14 + i * 0.06, duration: 0.35 }}
              className="text-[15px] font-medium text-white/85"
            >
              {l}
            </motion.p>
          ))}
        </div>
      </div>
    </div>
  );
}