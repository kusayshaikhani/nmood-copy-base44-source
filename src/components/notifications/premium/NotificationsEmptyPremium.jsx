import React from 'react';
import { motion } from 'framer-motion';
import { Bell } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

/**
 * UI-019 — Premium empty state with illustration glow.
 * "You're all caught up." / "We'll notify you when something important happens."
 */
export default function NotificationsEmptyPremium() {
  const { t } = useLocalization();
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative w-28 h-28 mb-6"
      >
        <div className="absolute inset-0 rounded-full bg-nmood-gradient opacity-15 blur-2xl" />
        <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-primary/10 to-accent/15 flex items-center justify-center ring-1 ring-primary/10">
          <Bell className="w-12 h-12 text-primary/40" strokeWidth={1.5} />
        </div>
      </motion.div>
      <h3 className="text-xl font-bold mb-2">{t('notifications.premium.empty_title')}</h3>
      <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
        {t('notifications.premium.empty_desc')}
      </p>
    </div>
  );
}