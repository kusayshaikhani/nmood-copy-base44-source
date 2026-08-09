import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Users } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

/**
 * UI-004 Phase 6 — "Live Around You" pulse card.
 * Shows ONLY real platform statistics from passed-in data.
 * Metrics with zero count are omitted; card hides entirely if all are zero.
 * Never fabricates activity.
 */
export default function LivePulseCard({ experiences, circles }) {
  const { t } = useLocalization();

  const startingSoon = (experiences || []).filter(
    (e) => (e.tags || []).includes('today')
  ).length;
  const activeCircles = (circles || []).length;

  const metrics = [];
  if (startingSoon > 0) {
    metrics.push({ icon: Calendar, value: startingSoon, label: t('discovery.live_pulse.starting_soon') });
  }
  if (activeCircles > 0) {
    metrics.push({ icon: Users, value: activeCircles, label: t('discovery.live_pulse.active_circles') });
  }

  if (metrics.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-card border border-border/40 shadow-card"
    >
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
        </span>
        <span className="text-xs font-bold text-foreground uppercase tracking-wide whitespace-nowrap">
          {t('discovery.live_pulse.title')}
        </span>
      </div>
      <div className="flex items-center gap-4 ml-auto">
        {metrics.map(({ icon: Icon, value, label }, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <Icon className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-foreground">{value}</span>
            <span className="text-xs text-muted-foreground whitespace-nowrap">{label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}