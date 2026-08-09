import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getGreeting } from '@/lib/inmood-engine';
import { useAuth } from '@/lib/AuthContext';

const EMOTION_CARDS = [
  { key: 'inspiration', label: 'I want\ninspiration', image: 'https://media.base44.com/images/public/6a4881a4266c514a9d9ebc6c/4bb4fd35c_1.png' },
  { key: 'reset', label: 'I need\na reset', image: 'https://media.base44.com/images/public/6a4881a4266c514a9d9ebc6c/4663fd8e2_2.png' },
  { key: 'exploring', label: 'I want\nto explore', image: 'https://media.base44.com/images/public/6a4881a4266c514a9d9ebc6c/d234b4f90_3.png' },
  { key: 'fun', label: 'I want to\nhave fun', image: 'https://media.base44.com/images/public/6a4881a4266c514a9d9ebc6c/a7c0e0331_4.png' },
  { key: 'peace', label: 'I need\nsome peace', image: 'https://media.base44.com/images/public/6a4881a4266c514a9d9ebc6c/214e0869f_5.png' },
  { key: 'company', label: "I'd like\nsome company", image: 'https://media.base44.com/images/public/6a4881a4266c514a9d9ebc6c/5c9e609bd_6.png' },
  { key: 'surprise', label: 'Surprise\nme', image: 'https://media.base44.com/images/public/6a4881a4266c514a9d9ebc6c/b5af38f24_7.png' },
];

function pullTitle() {
  const h = new Date().getHours();
  if (h < 12) return "What's pulling you this morning?";
  if (h < 17) return "What's pulling you this afternoon?";
  if (h < 21) return "What's pulling you this evening?";
  return "What's pulling you tonight?";
}

export default function EmotionalEntry({ onSelected }) {
  const { user } = useAuth();
  const [active, setActive] = useState(() => {
    try { return localStorage.getItem('inmood_emotion') || null; } catch { return null; }
  });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (active) onSelected?.(active);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelect = (key) => {
    if (updating) return;
    setActive(key);
    try { localStorage.setItem('inmood_emotion', key); } catch { /* ignore */ }
    setUpdating(true);
    onSelected?.(key);
    setTimeout(() => setUpdating(false), 800);
  };

  const greeting = getGreeting();
  const firstName = user?.full_name?.split(' ')[0] || 'there';

  return (
    <section className="pt-2">
      <p className="text-sm text-muted-foreground">{greeting},</p>
      <h1 className="text-2xl font-bold tracking-tight mb-5">{firstName} <span className="inline-block">👋</span></h1>

      <h2 className="text-2xl font-bold tracking-tight leading-tight">{pullTitle()}</h2>
      <p className="text-sm text-muted-foreground mt-1.5 mb-5">Choose what feels closest to how you're feeling right now.</p>

      <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-1 pb-2">
        {EMOTION_CARDS.map((c) => {
          const isActive = active === c.key;
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => handleSelect(c.key)}
              className="flex-shrink-0 w-[130px] h-[195px] rounded-3xl overflow-hidden relative"
              style={{
                transform: isActive ? 'translateY(-4px) scale(1.02)' : 'none',
                transition: 'transform 200ms ease-out, box-shadow 200ms ease-out',
                boxShadow: isActive
                  ? '0 12px 28px hsl(var(--primary)/0.35), 0 0 0 2px hsl(var(--primary))'
                  : '0 2px 8px rgba(0,0,0,0.08)',
              }}
            >
              <img src={c.image} alt={c.label.replace('\n', ' ')} className="absolute inset-0 w-full h-full object-cover" draggable={false} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 text-left">
                <span className="block text-lg font-semibold text-white leading-tight" style={{ whiteSpace: 'pre-line' }}>{c.label}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="h-7 mt-3 flex items-center justify-center">
        <AnimatePresence>
          {updating && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-sm text-muted-foreground">
              <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 0.8, repeat: Infinity }} className="w-2 h-2 rounded-full bg-primary" />
              Updating recommendations…
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}