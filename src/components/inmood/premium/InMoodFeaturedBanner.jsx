import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { ChevronRight } from 'lucide-react';

const CONFIG = {
  mood_match: { emoji: '🌅', titleKey: 'inmood.featured.mood_match', subKey: 'inmood.featured.mood_sub', gradient: 'from-violet-500/15 to-fuchsia-500/15' },
  trending: { emoji: '🔥', titleKey: 'inmood.featured.trending', subKey: 'inmood.featured.trending_sub', gradient: 'from-orange-500/15 to-rose-500/15' },
  friends_joining: { emoji: '👥', titleKey: 'inmood.featured.friends_joining', subKey: 'inmood.featured.friends_sub', gradient: 'from-emerald-500/15 to-teal-500/15' },
  ai_recommended: { emoji: '✨', titleKey: 'inmood.featured.ai_recommended', subKey: 'inmood.featured.ai_sub', gradient: 'from-primary/15 to-accent/15' },
};

export default function InMoodFeaturedBanner({ type, index }) {
  const { t } = useLocalization();
  const navigate = useNavigate();
  const cfg = CONFIG[type] || CONFIG.ai_recommended;

  return (
    <motion.button
      type="button"
      onClick={() => navigate('/explore')}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
      whileTap={{ scale: 0.98 }}
      className={`w-full flex items-center gap-3.5 p-4 rounded-[20px] bg-gradient-to-r ${cfg.gradient} border border-border/30 backdrop-blur-sm shadow-soft text-start transition-[box-shadow,transform] duration-300 hover:shadow-card`}
    >
      <span className="w-12 h-12 rounded-full bg-card/80 backdrop-blur flex items-center justify-center text-2xl flex-shrink-0">
        {cfg.emoji}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold tracking-tight">{t(cfg.titleKey)}</p>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{t(cfg.subKey)}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-primary flex-shrink-0" />
    </motion.button>
  );
}