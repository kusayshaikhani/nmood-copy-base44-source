import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Sparkles, Compass, Heart } from 'lucide-react';

const STYLES = {
  ai_pick: { Icon: Sparkles, wash: 'from-primary/10 to-accent/5' },
  explore_new: { Icon: Compass, wash: 'from-primary/10 to-primary/5' },
  shared_interests: { Icon: Heart, wash: 'from-accent/10 to-primary/5' },
};

export default function V2RecommendationCard({ type = 'ai_pick', headline, subtitle, onClick }) {
  const s = STYLES[type] || STYLES.ai_pick;
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -60px 0px' }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      whileTap={{ scale: 0.99 }}
      className="group relative flex w-full items-center gap-3.5 rounded-card border border-border/40 bg-card hover:border-border/60 shadow-soft transition-colors duration-300 px-4 py-3.5 text-left overflow-hidden"
    >
      {/* Subtle accent wash — never promotional */}
      <div className={`absolute inset-0 bg-gradient-to-br ${s.wash} pointer-events-none`} />
      <div className="relative flex-shrink-0 w-11 h-11 rounded-full bg-primary/10 ring-1 ring-primary/10 flex items-center justify-center">
        <s.Icon className="w-[18px] h-[18px] text-primary" strokeWidth={1.8} />
      </div>
      <div className="relative min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{headline}</p>
        <p className="text-[12.5px] text-foreground/80 leading-snug mt-1 line-clamp-2">{subtitle}</p>
      </div>
      <ChevronRight className="relative w-4 h-4 text-muted-foreground flex-shrink-0 group-hover:text-primary transition-colors duration-200" />
    </motion.button>
  );
}