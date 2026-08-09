import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, TrendingUp, Minus } from 'lucide-react';
import { moodCategories, liveActivity } from '@/lib/live-pulse-data';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { categoryLabel } from '@/lib/i18n/label-resolvers';

export default function LivePulseSection() {
  const { t } = useLocalization();
  const [tick, setTick] = useState(0);
  const [activityIndex, setActivityIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
      setActivityIndex((i) => (i + 1) % liveActivity.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const totalInMood = moodCategories.reduce((sum, m) => sum + m.count, 0);

  return (
    <div className="rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/5 via-accent/5 to-transparent p-5 overflow-hidden relative">
      <div className="flex items-center gap-2 mb-1">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
        </span>
        <h2 className="font-semibold text-lg">{t('livepulse.title')}</h2>
        <Activity className="w-4 h-4 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        <AnimatePresence mode="wait">
          <motion.span
            key={activityIndex}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.4 }}
            className="inline-block"
          >
            {(() => {
              const a = liveActivity[activityIndex];
              const params = { count: a.count };
              if (a.moodKey) params.mood = categoryLabel(t, a.moodKey);
              return t('livepulse.activity.' + a.key, params);
            })()}
          </motion.span>
        </AnimatePresence>
      </p>

      <div className="mb-4">
        <p className="text-xs text-muted-foreground mb-2.5">{t('livepulse.people_now')}</p>
        <div className="grid grid-cols-5 gap-2">
          {moodCategories.map((m, i) => (
            <motion.div
              key={m.key}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06 }}
              className="flex flex-col items-center gap-1 p-2.5 rounded-2xl bg-card/80 backdrop-blur border border-border/50"
            >
              <span className="text-xl">{m.emoji}</span>
              <span className="text-base font-bold tabular-nums">{m.count + (tick % 3 === i % 3 ? 1 : 0)}</span>
              <span className="text-[9px] text-muted-foreground leading-none">{categoryLabel(t, m.key)}</span>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border/50">
        <span className="text-xs text-muted-foreground">{t('livepulse.total_active')}</span>
        <span className="flex items-center gap-1.5 text-sm font-semibold text-success">
          <TrendingUp className="w-3.5 h-3.5" />
          {t('livepulse.total_people', { count: totalInMood })}
        </span>
      </div>
    </div>
  );
}