import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { timelineMilestones } from '@/lib/journey-data';

export default function TimelineSection() {
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Timeline</h2>
        <p className="text-sm text-muted-foreground">Milestones along your journey.</p>
      </div>
      <div className="relative">
        <div className="absolute left-4 top-2 bottom-2 w-px bg-border" />
        <div className="space-y-3">
          {timelineMilestones.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: i * 0.05 }}
              className="relative pl-12"
            >
              <div className="absolute left-0 top-1.5 w-9 h-9 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-base flex-shrink-0">
                {m.emoji}
              </div>
              <Card className="p-3.5 hover-lift">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-sm">{m.title}</p>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">{m.date}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{m.description}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}