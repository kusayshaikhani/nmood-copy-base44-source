import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Settings } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

// UI-023 — Sticky bottom CTA.
// Explorer → Upgrade to Premium · Premium → Manage Subscription.
export default function PremiumStickyCta({ isPremium, onClick }) {
  const { t } = useLocalization();
  return (
    <div className="fixed inset-x-0 bottom-[72px] sm:bottom-5 z-30 pointer-events-none">
      <div className="max-w-2xl mx-auto px-4">
        <div className="pointer-events-auto rounded-button bg-card/80 backdrop-blur-xl border border-border/60 shadow-elevated p-2.5">
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={onClick}
            className={`w-full h-12 rounded-button font-semibold text-[15px] flex items-center justify-center gap-2 transition-all ${
              isPremium
                ? 'bg-card border border-border text-foreground hover:bg-secondary'
                : 'bg-nmood-gradient text-primary-foreground shadow-card'
            }`}
          >
            {isPremium ? (
              <>
                <Settings className="w-4 h-4" /> {t('membership.premium.manage_subscription')}
              </>
            ) : (
              <>
                <Crown className="w-4 h-4" /> {t('membership.premium.upgrade_cta')}
              </>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}