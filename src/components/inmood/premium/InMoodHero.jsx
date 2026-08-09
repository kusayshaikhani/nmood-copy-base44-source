import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal, Sparkles, Bell } from 'lucide-react';
import BrandLogo from '@/components/brand/BrandLogo';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function InMoodHero({ onSearch, onFilter, onShare }) {
  const { t } = useLocalization();
  const navigate = useNavigate();
  const handleShare = onShare || (() => navigate('/host/create'));
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="relative">
      {/* ── Sticky compact header — transparent at top, frosted when scrolled ── */}
      <header
        className={`sticky top-0 z-30 transition-all duration-300 ${
          scrolled
            ? 'bg-background/70 backdrop-blur-xl border-b border-border/30 shadow-soft'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <div className="flex items-center justify-between h-14 px-4">
          <BrandLogo size="sm" />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onSearch}
              aria-label={t('common.search')}
              className="w-10 h-10 rounded-full glass border border-border/40 flex items-center justify-center hover:bg-white/60 dark:hover:bg-white/10 transition-default"
            >
              <Search className="w-5 h-5 text-foreground" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/notifications')}
              aria-label={t('nav.notifications')}
              className="relative w-10 h-10 rounded-full glass border border-border/40 flex items-center justify-center hover:bg-white/60 dark:hover:bg-white/10 transition-default"
            >
              <Bell className="w-5 h-5 text-foreground" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-primary border border-background" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero entrance — large title + subtitle + premium search ── */}
      <div className="relative overflow-hidden bg-gradient-to-b from-primary/12 via-accent/5 to-transparent px-4 pt-2 pb-7">
        <div className="absolute -top-20 -right-10 w-48 h-48 rounded-full bg-primary/15 blur-3xl pointer-events-none" />
        <div className="absolute top-8 -left-16 w-40 h-40 rounded-full bg-accent/20 blur-3xl pointer-events-none" />
        <div className="relative">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }}>
            <h1 className="text-[28px] sm:text-[32px] font-bold tracking-tight leading-[1.1]">
              {t('inmood.redesign.hero.title')}
            </h1>
            <p className="text-sm text-muted-foreground mt-2.5 mb-6 max-w-[34ch] leading-relaxed">
              {t('inmood.redesign.hero.subtitle')}
            </p>

            {/* Premium search field — rounded, subtle elevation, tappable */}
            <button
              type="button"
              onClick={onSearch}
              className="group w-full h-14 rounded-2xl bg-card border border-border/40 shadow-card flex items-center gap-3 px-4 hover:shadow-elevated hover:border-border/70 transition-default text-start"
            >
              <span className="flex items-center justify-center w-9 h-9 rounded-full bg-secondary/70 flex-shrink-0">
                <Search className="w-4.5 h-4.5 text-muted-foreground" />
              </span>
              <span className="flex-1 text-sm text-muted-foreground truncate">
                {t('discovery.search_placeholder')}
              </span>
              <span className="flex items-center justify-center w-9 h-9 rounded-full text-muted-foreground/70 flex-shrink-0">
                <SlidersHorizontal className="w-4 h-4" />
              </span>
            </button>

            {/* Filter floating action chip + Share plan CTA */}
            <div className="flex items-center gap-3 mt-4">
              <button
                type="button"
                onClick={onFilter}
                className="inline-flex items-center gap-2 h-11 px-4 rounded-full glass border border-border/50 shadow-soft text-sm font-semibold text-foreground hover:bg-white/60 dark:hover:bg-white/10 transition-default flex-shrink-0"
              >
                <SlidersHorizontal className="w-4 h-4 text-primary" />
                {t('inmood.redesign.hero.filter')}
              </button>
              <motion.button
                type="button"
                onClick={handleShare}
                whileTap={{ scale: 0.97 }}
                className="flex-1 h-11 rounded-full bg-nmood-cta text-primary-foreground font-bold text-sm shadow-elevated flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                {t('inmood.redesign.hero.share_plan')}
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}