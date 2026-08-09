import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { journeyInsights } from '@/lib/journey-data';

export default function InsightsSection() {
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Insights</h2>
        <p className="text-sm text-muted-foreground">Patterns in your journey.</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {journeyInsights.map((insight, i) => {
          const Icon = insight.icon;
          return (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ delay: (i % 3) * 0.05 }}
            >
              <Card className="p-4 h-full">
                <div className="flex items-center gap-1.5 mb-2">
                  <Icon className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[11px] text-muted-foreground">{insight.label}</span>
                </div>
                <p className="font-semibold text-sm">{insight.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{insight.detail}</p>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}