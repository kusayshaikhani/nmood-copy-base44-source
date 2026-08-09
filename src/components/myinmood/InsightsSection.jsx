import React from 'react';
import { motion } from 'framer-motion';
import { useMoodInsights } from '@/lib/myinmood-live';

export default function InsightsSection() {
  const { insights, loading } = useMoodInsights();

  if (loading) {
    return (
      <section>
        <h2 className="text-lg font-semibold mb-1">Insights</h2>
        <p className="text-sm text-muted-foreground mb-3">You're most Nmood for:</p>
        <div className="space-y-2.5">
          {[0, 1].map((i) => (
            <div key={i} className="h-10 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (insights.length === 0) return null;

  return (
    <section>
      <h2 className="text-lg font-semibold mb-1">Insights</h2>
      <p className="text-sm text-muted-foreground mb-3">You're most Nmood for:</p>
      <div className="space-y-2.5">
        {insights.map((insight, i) => (
          <motion.div
            key={insight.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-3"
          >
            <span className="text-xl flex-shrink-0">{insight.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{insight.label}</span>
                <span className="text-xs text-muted-foreground">{insight.percentage}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${insight.percentage}%` }}
                  transition={{ duration: 0.6, delay: i * 0.05, ease: 'easeOut' }}
                  className={`h-full rounded-full ${insight.color}`}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}