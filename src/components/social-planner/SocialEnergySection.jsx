import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { socialEnergyInsights } from '@/lib/social-planner-data';

export default function SocialEnergySection() {
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-accent" />
        <h2 className="text-lg font-semibold">Social Energy</h2>
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-accent/10 to-primary/5 p-4 space-y-3">
        <p className="text-xs text-muted-foreground">Gentle observations about your social rhythm.</p>
        {socialEnergyInsights.map((insight, i) => (
          <motion.div
            key={insight.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="flex items-start gap-2.5"
          >
            <span className="text-lg flex-shrink-0 leading-none mt-0.5">{insight.icon}</span>
            <p className="text-sm leading-snug text-foreground">{insight.text}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}