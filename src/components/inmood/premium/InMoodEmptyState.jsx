import React from 'react';
import { motion } from 'framer-motion';
import { Compass, Expand, Shuffle, TrendingUp, Plus, UserPlus } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function InMoodEmptyState({ onShare, onExplore, onExpandDistance, onTryCategory, onTrending, onInvite }) {
  const { t } = useLocalization();
  const suggestions = [
    { icon: Expand, label: t('inmood.intel.empty_expand'), onClick: onExpandDistance },
    { icon: Shuffle, label: t('inmood.intel.empty_category'), onClick: onTryCategory },
    { icon: TrendingUp, label: t('inmood.intel.empty_trending'), onClick: onTrending },
    { icon: Plus, label: t('inmood.intel.empty_create'), onClick: onShare },
    { icon: UserPlus, label: t('inmood.intel.empty_invite'), onClick: onInvite },
  ].filter((s) => s.onClick);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="rounded-[20px] border border-dashed border-border/40 bg-gradient-to-b from-primary/5 to-transparent p-8 text-center"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.1 }}
        className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center mb-5"
      >
        <Compass className="w-9 h-9 text-primary" />
      </motion.div>
      <h3 className="text-lg font-bold mb-1.5">{t('inmood.redesign.empty.title')}</h3>
      <p className="text-sm text-muted-foreground mb-6">{t('inmood.redesign.empty.subtitle')}</p>

      {suggestions.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {suggestions.map((s, i) => {
            const Icon = s.icon;
            return (
              <button
                key={i}
                type="button"
                onClick={s.onClick}
                className="flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-secondary text-foreground text-xs font-semibold border border-border/40 hover:bg-muted transition-colors duration-200"
              >
                <Icon className="w-3.5 h-3.5" /> {s.label}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-sm mx-auto">
        <button
          type="button"
          onClick={onShare}
          className="flex-1 h-11 min-h-[44px] rounded-button bg-nmood-cta text-primary-foreground text-sm font-bold shadow-card hover:shadow-elevated transition-shadow"
        >
          {t('inmood.redesign.empty.share')}
        </button>
        <button
          type="button"
          onClick={onExplore}
          className="flex-1 h-11 min-h-[44px] rounded-button border border-border/70 bg-card text-foreground text-sm font-semibold transition-[background-color,border-color] duration-200 hover:bg-muted/50"
        >
          {t('inmood.redesign.empty.explore')}
        </button>
      </div>
    </motion.div>
  );
}