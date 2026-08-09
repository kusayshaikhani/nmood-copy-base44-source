import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';
import { getWeeklyProgress } from '@/lib/goals-data';

export default function GoalWeeklyProgress({ goalKey }) {
  const progress = getWeeklyProgress(goalKey);
  const items = [
    { ...progress.attended },
    { ...progress.met },
    { ...progress.became_pals },
    { ...progress.hosted },
  ];

  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">This Week</h2>
        <p className="text-sm text-muted-foreground">A snapshot of your recent progress.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {items.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="p-4 text-center h-full">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <p className="text-2xl font-bold">{item.count}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.label}</p>
              </Card>
            </motion.div>
          );
        })}
      </div>
      <div className="flex items-center gap-2 mt-3 p-3 rounded-2xl bg-primary/5 border border-primary/20">
        <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
        <p className="text-xs text-muted-foreground">
          You're making progress. Every connection is a step forward.
        </p>
      </div>
    </section>
  );
}