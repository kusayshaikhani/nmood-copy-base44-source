import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function MilestonesSection({ milestones }) {
  if (!milestones?.length) return null;
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Milestones</h2>
        <p className="text-sm text-muted-foreground">Your personal progress.</p>
      </div>
      <div className="space-y-3">
        {milestones.map((m, i) => {
          const Icon = m.icon;
          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 5) * 0.05 }}
            >
              <Card className="p-4">
                <div className="flex items-center gap-3 mb-2.5">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${m.complete ? 'bg-success/10' : 'bg-primary/10'}`}>
                    {m.complete ? <Check className="w-4 h-4 text-success" /> : <Icon className="w-4 h-4 text-primary" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{m.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {m.complete ? `Reached ${m.currentTier}+` : `${m.value} of ${m.next}`}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-primary">{m.value}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${m.complete ? 'bg-success' : 'bg-gradient-to-r from-primary to-accent'}`}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${m.progress}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}