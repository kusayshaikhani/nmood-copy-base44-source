import React from 'react';
import { motion } from 'framer-motion';
import { Pause, Archive } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { goalDefinitions } from '@/lib/goals-data';

export default function GoalCard({ goal, onClick }) {
  const definition = goalDefinitions.find((g) => g.key === goal.goal_key);
  if (!definition) return null;
  const Icon = definition.icon;
  const isPaused = goal.status === 'paused';

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
    >
      <Card className={`p-4 hover-lift cursor-pointer ${isPaused ? 'opacity-60' : ''}`}>
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${isPaused ? 'bg-muted' : 'bg-primary/10'}`}>
            <Icon className={`w-5 h-5 ${isPaused ? 'text-muted-foreground' : 'text-primary'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{definition.label}</p>
            <p className="text-xs text-muted-foreground truncate">{definition.description}</p>
          </div>
          {isPaused && <Pause className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{goal.progress || 0}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${goal.progress || 0}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className={`h-full rounded-full ${isPaused ? 'bg-muted-foreground' : 'bg-primary'}`}
            />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}