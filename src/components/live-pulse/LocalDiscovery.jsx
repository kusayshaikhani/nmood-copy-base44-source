import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigation } from 'lucide-react';
import { localRanges } from '@/lib/live-pulse-data';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function LocalDiscovery({ experiences = [], onSelect }) {
  const { t } = useLocalization();
  const [activeRange, setActiveRange] = useState(2);

  const filtered = experiences.filter((e) => {
    const dist = parseFloat(String(e.distance).replace(/[^0-9.]/g, '')) || 999;
    if (activeRange === 2) return dist <= 2;
    if (activeRange === 5) return dist <= 5;
    return dist <= 10;
  });

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Navigation className="w-4 h-4 text-primary" />
        <h2 className="font-semibold text-lg">{t('livepulse.near_you')}</h2>
      </div>

      <div className="flex gap-2 mb-3">
        {localRanges.map((r) => {
          const dist = parseInt(r.label.match(/\d+/)[0], 10);
          return (
          <button
            key={r.label}
            type="button"
            onClick={() => setActiveRange(dist)}
            className={`flex-1 flex flex-col items-center py-2.5 rounded-xl border transition-default ${
              activeRange === dist
                ? 'border-primary bg-primary/5'
                : 'border-border bg-card'
            }`}
          >
            <span className="text-xs font-medium">{t('livepulse.range_within', { distance: dist })}</span>
            <span className="text-[10px] text-muted-foreground">{t('livepulse.range_nearby', { count: r.count })}</span>
          </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeRange}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-2"
        >
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">{t('livepulse.no_experiences', { distance: activeRange })}</p>
          ) : (
            filtered.slice(0, 3).map((exp) => (
              <button
                key={exp.id}
                type="button"
                onClick={() => onSelect?.(exp)}
                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-card border border-border/50 hover-lift text-left"
              >
                <img src={exp.image} alt={exp.title} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" loading="lazy" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm line-clamp-1">{exp.title}</p>
                  <p className="text-xs text-muted-foreground">{exp.distance} · {exp.category}</p>
                </div>
                <span className="text-xs font-semibold text-success">{exp.budget}</span>
              </button>
            ))
          )}
        </motion.div>
      </AnimatePresence>

      <p className="text-[10px] text-muted-foreground mt-2 text-center">{t('livepulse.location_note')}</p>
    </div>
  );
}