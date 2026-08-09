import React from 'react';
import { motion } from 'framer-motion';
import { Users, Circle, Sparkles, Calendar, ThumbsUp } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

/**
 * UI-017 — Five premium stat cards in a horizontal snap-scroll rail.
 * Each card: icon, value, label. Skeletons while loading.
 */
export default function ProfileQuickStats({ stats, loading }) {
  const { t } = useLocalization();
  const items = [
    { id: 'pals', icon: Users, value: stats.pals, label: t('profile.premium.stats.pals'), tint: 'bg-primary/10 text-primary' },
    { id: 'circles', icon: Circle, value: stats.circles, label: t('profile.premium.stats.circles'), tint: 'bg-chart-1/10 text-chart-1' },
    { id: 'hosted', icon: Sparkles, value: stats.hosted, label: t('profile.premium.stats.hosted'), tint: 'bg-chart-3/10 text-chart-3' },
    { id: 'joined', icon: Calendar, value: stats.joined, label: t('profile.premium.stats.joined'), tint: 'bg-chart-2/10 text-chart-2' },
    { id: 'recs', icon: ThumbsUp, value: stats.recommendations, label: t('profile.premium.stats.recommendations'), tint: 'bg-accent/20 text-accent-foreground' },
  ];

  if (loading) {
    return (
      <div className="flex gap-3 overflow-hidden px-6">
        {items.map((s) => (
          <div key={s.id} className="flex-shrink-0 w-32 h-24 rounded-card bg-muted shimmer" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto no-scrollbar overscroll-x-contain snap-x snap-mandatory px-6 pb-1">
      {items.map((s, i) => {
        const Icon = s.icon;
        return (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className="flex-shrink-0 w-32 snap-start rounded-card border border-border/50 bg-card p-4 shadow-card pressable"
          >
            <div className={`w-9 h-9 rounded-full flex items-center justify-center ${s.tint}`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold mt-3 leading-none">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1.5 leading-tight">{s.label}</p>
          </motion.div>
        );
      })}
    </div>
  );
}