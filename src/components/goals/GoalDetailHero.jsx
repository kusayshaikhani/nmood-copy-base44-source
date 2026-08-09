import React from 'react';
import { motion } from 'framer-motion';
import { Pause, Play, Archive, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { goalDefinitions, encouragingMessages } from '@/lib/goals-data';

export default function GoalDetailHero({ goal, onStatusChange, onRemove }) {
  const definition = goalDefinitions.find((g) => g.key === goal.goal_key);
  if (!definition) return null;
  const Icon = definition.icon;
  const isPaused = goal.status === 'paused';
  const message = encouragingMessages[goal.goal_key.charCodeAt(0) % encouragingMessages.length];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="p-5 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${isPaused ? 'bg-muted' : 'bg-primary/10'}`}>
            <Icon className={`w-7 h-7 ${isPaused ? 'text-muted-foreground' : 'text-primary'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold">{definition.label}</h1>
            <p className="text-sm text-muted-foreground">{definition.description}</p>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Your progress</span>
            <span className="font-semibold">{goal.progress || 0}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${goal.progress || 0}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className={`h-full rounded-full ${isPaused ? 'bg-muted-foreground' : 'bg-primary'}`}
            />
          </div>
        </div>

        <p className="text-sm text-muted-foreground italic mb-4">"{message}"</p>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5"
            onClick={() => onStatusChange(isPaused ? 'active' : 'paused')}
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            {isPaused ? 'Resume' : 'Pause'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5"
            onClick={() => onStatusChange('archived')}
          >
            <Archive className="w-4 h-4" />
            Archive
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="text-destructive hover:text-destructive"
            onClick={onRemove}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}