import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import { lookBackMemories } from '@/lib/journey-data';

export default function LookBackSection() {
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">This time last year...</h2>
        <p className="text-sm text-muted-foreground">Memories from July 2025.</p>
      </div>
      <div className="space-y-3">
        {lookBackMemories.map((m, i) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-30px' }}
            transition={{ delay: i * 0.08 }}
          >
            <Card className="overflow-hidden hover-lift">
              <div className="flex flex-col sm:flex-row">
                <img
                  src={m.image}
                  alt={m.title}
                  className="w-full sm:w-32 h-32 sm:h-auto object-cover flex-shrink-0"
                  loading="lazy"
                />
                <div className="p-4 flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Clock className="w-3 h-3 text-primary" />
                    <span className="text-[11px] text-muted-foreground">{m.date}</span>
                  </div>
                  <p className="font-semibold text-sm">{m.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{m.description}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}