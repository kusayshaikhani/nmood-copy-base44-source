import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Clock, XCircle, Users } from 'lucide-react';

const conflictConfig = {
  overlap: { icon: Clock, color: 'text-warning', bg: 'bg-warning/10', label: 'Time Overlap' },
  full: { icon: Users, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Full Experience' },
  cancelled: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Cancelled' },
};

export default function ConflictWarning({ conflicts = [], onClick }) {
  if (conflicts.length === 0) return null;

  return (
    <div className="space-y-2 mb-4">
      <AnimatePresence>
        {conflicts.map((c, i) => {
          const cfg = conflictConfig[c.type] || conflictConfig.overlap;
          const Icon = cfg.icon;
          const message = c.type === 'overlap'
            ? `${c.activityA.title} overlaps with ${c.activityB.title}`
            : c.type === 'full'
              ? `${c.activity.title} is now full`
              : `${c.activity.title} has been cancelled`;

          return (
            <motion.button
              key={c.type + i}
              type="button"
              onClick={() => onClick?.(c)}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className={`w-full flex items-center gap-3 p-3 rounded-2xl ${cfg.bg} border border-border/50 text-start`}
            >
              <Icon className={`w-4 h-4 ${cfg.color} flex-shrink-0`} />
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</p>
                <p className="text-xs text-muted-foreground truncate">{message}</p>
              </div>
              <AlertTriangle className={`w-3.5 h-3.5 ${cfg.color} flex-shrink-0`} />
            </motion.button>
          );
        })}
      </AnimatePresence>
    </div>
  );
}