import React from 'react';
import { motion } from 'framer-motion';
import { Users, Sparkles, FileEdit, MessagesSquare } from 'lucide-react';
import { PREMIUM_BENEFITS } from '@/lib/premium-benefits';
import { useLocalization } from '@/lib/i18n/useLocalization';

// UI-023 — Premium benefit cards (icon · title · one-line description).
const ICONS = [Users, Sparkles, FileEdit, MessagesSquare];

export default function PremiumBenefitsGrid() {
  const { t } = useLocalization();
  return (
    <div>
      <div className="px-1 mb-4">
        <h2 className="font-heading text-xl font-bold tracking-tight">{t('membership.premium.benefits_title')}</h2>
        <p className="text-[13px] text-muted-foreground mt-0.5">{t('membership.premium.benefits_subtitle')}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {PREMIUM_BENEFITS.map((b, i) => {
          const Icon = ICONS[i];
          return (
            <motion.div
              key={b.key}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
              className="rounded-card border border-border/50 bg-card p-4 shadow-soft"
            >
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-3 bg-gradient-to-br from-primary/15 to-primary/5 text-primary`}>
                <Icon className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <h3 className="text-[13.5px] font-semibold leading-tight">{b.title}</h3>
              <p className="text-[12px] text-muted-foreground mt-1 leading-snug">{b.description}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}