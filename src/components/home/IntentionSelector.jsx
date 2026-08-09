import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { moodCategories } from '@/lib/live-pulse-data';

const intentions = [
  { id: 'connect', label: 'Connect', emoji: '🤝' },
  { id: 'explore', label: 'Explore', emoji: '🌍' },
  { id: 'learn', label: 'Learn', emoji: '📚' },
  { id: 'relax', label: 'Relax', emoji: '🧘' },
  { id: 'adventure', label: 'Adventure', emoji: '🏔️' },
  { id: 'coffee', label: 'Coffee', emoji: '☕' },
  { id: 'sports', label: 'Sports', emoji: '⚽' },
  { id: 'networking', label: 'Networking', emoji: '👥' },
];

export default function IntentionSelector({ onSelect }) {
  const [selected, setSelected] = useState(() => localStorage.getItem('inmood_intention') || null);

  const handleSelect = (id) => {
    const next = selected === id ? null : id;
    setSelected(next);
    if (next) localStorage.setItem('inmood_intention', next);
    else localStorage.removeItem('inmood_intention');
    if (onSelect) onSelect(next);
  };

  const selectedIntention = intentions.find(i => i.id === selected);

  return (
    <div>
      <h2 className="text-lg font-semibold mb-1">What are you Nmood for today?</h2>
      <p className="text-sm text-muted-foreground mb-3">Pick one — we'll tailor your feed</p>

      <div className="flex items-center gap-3 mb-3 p-3 rounded-2xl bg-primary/5 border border-primary/10">
        <div className="flex -space-x-2">
          {moodCategories.slice(0, 4).map((m) => (
            <span key={m.key} className="w-7 h-7 rounded-full bg-card border border-border flex items-center justify-center text-sm">
              {m.emoji}
            </span>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{moodCategories.reduce((s, m) => s + m.count, 0)} people</span> are Nmood right now
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {intentions.map((it) => (
          <motion.button
            key={it.id}
            onClick={() => handleSelect(it.id)}
            type="button"
            whileTap={{ scale: 0.92 }}
            whileHover={{ y: -1 }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border-2 transition-default text-sm ${
              selected === it.id
                ? 'border-primary bg-primary/5 text-primary font-semibold'
                : 'border-border text-muted-foreground hover:border-muted-foreground/30'
            }`}
          >
            <span className="text-base">{it.emoji}</span>
            <span>{it.label}</span>
          </motion.button>
        ))}
      </div>
      <AnimatePresence>
        {selectedIntention && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="flex items-center gap-2.5 mt-3 p-3 rounded-2xl bg-primary/5 border border-primary/20"
            >
              <span className="text-2xl">{selectedIntention.emoji}</span>
              <p className="text-sm font-medium">You're Nmood for {selectedIntention.label}.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}