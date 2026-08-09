import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { useSocialSnapshot } from '@/lib/myinmood-live';

export default function SocialSnapshot() {
  const { snapshot, loading } = useSocialSnapshot();

  if (loading && snapshot.length === 0) {
    return (
      <section>
        <h2 className="text-lg font-semibold mb-3">Social Snapshot</h2>
        <div className="grid grid-cols-3 gap-2.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (snapshot.length === 0) return null;

  return (
    <section>
      <h2 className="text-lg font-semibold mb-3">Social Snapshot</h2>
      <div className="grid grid-cols-3 gap-2.5">
        {snapshot.map((stat, i) => (
          <motion.div
            key={stat.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.04 }}
          >
            <Card className="p-3 text-center h-full">
              <p className="text-xl font-bold">{stat.value}</p>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 leading-tight">{stat.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}