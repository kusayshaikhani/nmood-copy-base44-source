import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CalendarPlus, Send, Compass, MapPin } from 'lucide-react';
import { quickActions } from '@/lib/social-planner-data';

const iconMap = { CalendarPlus, Send, Compass, MapPin };

const colorClasses = {
  primary: 'bg-primary/10 text-primary',
  accent: 'bg-accent/20 text-accent-foreground',
  info: 'bg-info/10 text-info',
  success: 'bg-success/10 text-success',
};

export default function QuickActionsSection() {
  const navigate = useNavigate();

  return (
    <section>
      <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-2.5">
        {quickActions.map((action, i) => {
          const Icon = iconMap[action.icon] || Compass;
          return (
            <motion.button
              key={action.id}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => navigate(action.link)}
              className="flex flex-col items-start gap-2 p-3.5 rounded-2xl border border-border bg-card hover:border-primary/30 transition-default text-left"
            >
              <div className={'w-9 h-9 rounded-xl flex items-center justify-center ' + (colorClasses[action.color] || colorClasses.primary)}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-sm font-medium">{action.label}</p>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}