import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Lock } from 'lucide-react';
import { achievements } from '@/lib/journey-data';

export default function AchievementsGrid() {
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Achievements</h2>
        <p className="text-sm text-muted-foreground">Meaningful milestones you've reached.</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {achievements.map((a, i) => {
          const Icon = a.icon;
          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ delay: (i % 3) * 0.05 }}
            >
              <Card className={`p-4 text-center h-full ${!a.unlocked ? 'opacity-50' : 'hover-lift'}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2.5 ${
                  a.unlocked ? 'bg-primary/10' : 'bg-muted'
                }`}>
                  {a.unlocked ? (
                    <Icon className="w-6 h-6 text-primary" />
                  ) : (
                    <Lock className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <p className="font-semibold text-sm">{a.title}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-snug">{a.description}</p>
                {a.unlocked && a.date && (
                  <p className="text-[10px] text-primary mt-2 font-medium">Unlocked · {a.date}</p>
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}