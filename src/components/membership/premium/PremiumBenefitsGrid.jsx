import React from 'react';
import { motion } from 'framer-motion';
import {
  Users, Radar, UsersRound, CalendarCheck, Sparkles, LifeBuoy, Crown, Rocket,
} from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

// UI-023 — Premium benefit cards (icon · title · one-line description).
const BENEFITS = [
  { icon: Users, key: 'unlimited_connections', tone: 'from-violet-500/15 to-violet-500/5 text-violet-600 dark:text-violet-400' },
  { icon: Radar, key: 'priority_discovery', tone: 'from-sky-500/15 to-sky-500/5 text-sky-600 dark:text-sky-400' },
  { icon: UsersRound, key: 'unlimited_circles', tone: 'from-emerald-500/15 to-emerald-500/5 text-emerald-600 dark:text-emerald-400' },
  { icon: CalendarCheck, key: 'unlimited_experiences', tone: 'from-amber-500/15 to-amber-500/5 text-amber-600 dark:text-amber-400' },
  { icon: Sparkles, key: 'ai_recommendations', tone: 'from-fuchsia-500/15 to-fuchsia-500/5 text-fuchsia-600 dark:text-fuchsia-400' },
  { icon: LifeBuoy, key: 'priority_support', tone: 'from-rose-500/15 to-rose-500/5 text-rose-600 dark:text-rose-400' },
  { icon: Crown, key: 'premium_badge', tone: 'from-primary/15 to-primary/5 text-primary' },
  { icon: Rocket, key: 'future_features', tone: 'from-indigo-500/15 to-indigo-500/5 text-indigo-600 dark:text-indigo-400' },
];

export default function PremiumBenefitsGrid() {
  const { t } = useLocalization();
  return (
    <div>
      <div className="px-1 mb-4">
        <h2 className="font-heading text-xl font-bold tracking-tight">{t('membership.premium.benefits_title')}</h2>
        <p className="text-[13px] text-muted-foreground mt-0.5">{t('membership.premium.benefits_subtitle')}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {BENEFITS.map((b, i) => {
          const Icon = b.icon;
          return (
            <motion.div
              key={b.key}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
              className="rounded-card border border-border/50 bg-card p-4 shadow-soft"
            >
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-3 bg-gradient-to-br ${b.tone}`}>
                <Icon className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <h3 className="text-[13.5px] font-semibold leading-tight">{t(`membership.premium.benefit.${b.key}_title`)}</h3>
              <p className="text-[12px] text-muted-foreground mt-1 leading-snug">{t(`membership.premium.benefit.${b.key}_desc`)}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}