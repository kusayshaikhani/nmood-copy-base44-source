import React from 'react';
import { motion } from 'framer-motion';
import { Users, Crown, Sparkles, MapPin, Heart, Target } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { socialGoals } from '@/lib/social-planner-data';

const iconMap = { Users, Crown, Sparkles, MapPin, Heart, Target };

const colorClasses = {
  primary: 'text-primary',
  accent: 'text-accent-foreground',
  info: 'text-info',
  success: 'text-success',
  warning: 'text-warning',
};

const barClasses = {
  primary: '[&>div]:bg-primary',
  accent: '[&>div]:bg-accent',
  info: '[&>div]:bg-info',
  success: '[&>div]:bg-success',
  warning: '[&>div]:bg-warning',
};

export default function SocialGoalsSection() {
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <Target className="w-4 h-4 text-primary" />
        <h2 className="text-lg font-semibold">Social Goals</h2>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2">
        {socialGoals.map((goal, i) => {
          const Icon = iconMap[goal.icon] || Target;
          return (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="p-3 rounded-xl border border-border bg-card"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
                  <Icon className={'w-3.5 h-3.5 ' + colorClasses[goal.color]} />
                </div>
                <p className="text-sm font-medium">{goal.label}</p>
              </div>
              <Progress value={goal.progress} className={'h-1.5 ' + (barClasses[goal.color] || '')} />
              <p className="text-[11px] text-muted-foreground mt-1.5">{goal.current}</p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}