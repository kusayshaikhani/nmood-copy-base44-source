import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

// UI-023 — Expandable FAQ cards.
const FAQ = ['cancel', 'connections', 'explorer', 'upgrade_later'];

export default function PremiumFaq() {
  const { t } = useLocalization();
  const [open, setOpen] = useState(null);

  return (
    <div>
      <div className="px-1 mb-4">
        <h2 className="font-heading text-lg font-bold tracking-tight">{t('membership.premium.faq_title')}</h2>
      </div>
      <div className="space-y-2.5">
        {FAQ.map((key) => {
          const isOpen = open === key;
          return (
            <div key={key} className="rounded-card border border-border/50 bg-card shadow-soft overflow-hidden">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : key)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-start"
              >
                <span className="text-[14px] font-semibold leading-snug">{t(`membership.premium.faq.${key}_q`)}</span>
                <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex-shrink-0">
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                  >
                    <p className="px-4 pb-4 text-[13px] text-muted-foreground leading-relaxed">
                      {t(`membership.premium.faq.${key}_a`)}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}