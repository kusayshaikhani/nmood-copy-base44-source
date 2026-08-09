import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function ActivityHistory({ history, loading }) {
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Activity History</h2>
        <p className="text-sm text-muted-foreground">Your real-life moments, newest first.</p>
      </div>
      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 rounded-xl shimmer" />
          ))}
        </div>
      ) : !history?.length ? (
        <Card className="p-6 text-center">
          <p className="text-sm text-muted-foreground">
            No activity yet. Join an experience or a Circle to start your story.
          </p>
        </Card>
      ) : (
        <div className="relative pl-6">
          <div className="absolute left-2 top-2 bottom-2 w-px bg-border" />
          <div className="space-y-3">
            {history.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: 10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: Math.min(i * 0.03, 0.3) }}
                  className="relative"
                >
                  <span className="absolute -left-[18px] top-3.5 w-2.5 h-2.5 rounded-full bg-primary border-2 border-background" />
                  <Card className="p-3.5 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{item.title}</p>
                      {item.detail && <p className="text-xs text-muted-foreground truncate">{item.detail}</p>}
                    </div>
                    <span className="text-[11px] text-muted-foreground flex-shrink-0">{formatDate(item.date)}</span>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}