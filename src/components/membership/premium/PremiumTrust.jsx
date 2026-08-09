import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, XCircle, Lock, BadgeDollarSign } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

// UI-023 — Trust indicators row.
const ITEMS = [
  { icon: ShieldCheck, key: 'secure', tone: 'text-success bg-success/10' },
  { icon: XCircle, key: 'cancel', tone: 'text-primary bg-primary/10' },
  { icon: Lock, key: 'encrypted', tone: 'text-info bg-info/10' },
  { icon: BadgeDollarSign, key: 'no_hidden', tone: 'text-warning bg-warning/10' },
];

export default function PremiumTrust() {
  const { t } = useLocalization();
  return (
    <div>
      <div className="px-1 mb-4">
        <h2 className="font-heading text-lg font-bold tracking-tight">{t('membership.premium.trust_title')}</h2>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {ITEMS.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              className="rounded-card border border-border/50 bg-card p-4 shadow-soft flex items-center gap-3"
            >
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${item.tone}`}>
                <Icon className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold leading-tight">{t(`membership.premium.trust.${item.key}_title`)}</p>
                <p className="text-[11.5px] text-muted-foreground mt-0.5 leading-snug">{t(`membership.premium.trust.${item.key}_desc`)}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}