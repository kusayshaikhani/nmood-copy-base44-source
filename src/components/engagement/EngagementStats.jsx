import React from 'react';
import { motion } from 'framer-motion';
import { Coffee, Users, Sparkles, Heart, Award } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function EngagementStats({ stats }) {
  if (!stats) return null;
  const items = [
    { icon: Coffee, label: 'Experiences', value: stats.experiencesJoined },
    { icon: Users, label: 'Circles', value: stats.circlesJoined },
    { icon: Heart, label: 'Pals', value: stats.pals },
    { icon: Sparkles, label: 'Hosted', value: stats.experiencesHosted },
    { icon: Award, label: 'Profile', value: `${stats.profileCompletion}%` },
  ];
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Your Statistics</h2>
        <p className="text-sm text-muted-foreground">Private — only you can see these.</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {items.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, scale: 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 5) * 0.05 }}
            >
              <Card className="p-4 flex flex-col items-center gap-1.5 text-center h-full">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-xl font-bold">{item.value}</span>
                <span className="text-[11px] text-muted-foreground">{item.label}</span>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}