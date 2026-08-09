import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Lock, CheckCircle2 } from 'lucide-react';
import { getGoalMilestones } from '@/lib/goals-data';

export default function GoalMilestones({ goalKey }) {
  const milestones = getGoalMilestones(goalKey);

  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Milestones</h2>
        <p className="text-sm text-muted-foreground">Celebrate meaningful achievements.</p>
      </div>
      <div className="space-y-2">
        {milestones.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className={`p-4 flex items-center gap-3 ${m.unlocked ? 'border-primary/20 bg-primary/5' : 'opacity-60'}`}>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                m.unlocked ? 'bg-success/10' : 'bg-muted'
              }`}>
                {m.unlocked ? (
                  <CheckCircle2 className="w-5 h-5 text-success" />
                ) : (
                  <Lock className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{m.title}</p>
                <p className="text-xs text-muted-foreground">{m.description}</p>
              </div>
              {m.unlocked && m.date && (
                <span className="text-[10px] text-primary font-medium whitespace-nowrap">{m.date}</span>
              )}
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}