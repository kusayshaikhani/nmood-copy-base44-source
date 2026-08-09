import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Flame, Leaf } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

/**
 * UI-004 Phase 6 — Contextual discovery insight.
 * Chooses a single recommendation based on time of day and available
 * experience data. Uses existing data — no API calls.
 */
function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  return 'evening';
}

export default function DiscoveryInsight({ experiences }) {
  const { t } = useLocalization();
  const tod = getTimeOfDay();

  const hasToday = (experiences || []).some((e) => (e.tags || []).includes('today'));

  let insightKey = 'discovery.insight.default';
  let Icon = Sparkles;

  if (hasToday && tod === 'evening') {
    insightKey = 'discovery.insight.popular_evening';
    Icon = Flame;
  } else if (tod === 'morning') {
    insightKey = 'discovery.insight.based_interests';
    Icon = Leaf;
  } else {
    insightKey = 'discovery.insight.trending_nearby';
    Icon = Sparkles;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-primary/5 border border-primary/15"
    >
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <span className="text-sm font-semibold text-foreground">{t(insightKey)}</span>
    </motion.div>
  );
}