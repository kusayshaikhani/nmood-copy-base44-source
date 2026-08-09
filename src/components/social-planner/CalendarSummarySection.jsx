import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarRange } from 'lucide-react';
import { useSocialPlannerData } from '@/lib/social-planner-live';
import { statusColors } from '@/lib/calendar-data';

export default function CalendarSummarySection() {
  const navigate = useNavigate();
  const { calendarSummary: summary } = useSocialPlannerData();
  const [expanded, setExpanded] = useState(null);

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <CalendarRange className="w-4 h-4 text-primary" />
        <h2 className="text-lg font-semibold">Calendar Summary</h2>
        <button
          type="button"
          onClick={() => navigate('/calendar')}
          className="ml-auto text-xs text-primary font-medium"
        >
          Full calendar
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {summary.map((period, i) => (
          <motion.button
            key={period.id}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => setExpanded(expanded === period.id ? null : period.id)}
            className="p-3 rounded-2xl border border-border bg-card text-left transition-default hover:border-primary/30"
          >
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-sm font-semibold">{period.label}</p>
              <span className={'text-[10px] font-medium px-1.5 py-0.5 rounded-full ' + (period.count > 0 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}>
                {period.count}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">{period.highlight}</p>

            <AnimatePresence>
              {expanded === period.id && period.items?.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mt-2 space-y-1.5"
                >
                  {period.items.map((item) => {
                    const status = statusColors[item.status] || statusColors.joined;
                    return (
                      <div key={item.id} className="flex items-center gap-2 p-1.5 rounded-lg bg-muted/50">
                        <div className={'w-1.5 h-6 rounded-full ' + status.dot} />
                        <div className="min-w-0">
                          <p className="text-[11px] font-medium truncate">{item.title}</p>
                          <p className="text-[10px] text-muted-foreground">{item.time}</p>
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        ))}
      </div>
    </section>
  );
}