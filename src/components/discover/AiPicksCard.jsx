import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

/**
 * UI-004 Phase 3 — Premium Nmood AI Picks card.
 * Purple gradient, concierge sparkle icon, "View Picks" CTA.
 * Navigates to /inmood (existing AI recommendation surface).
 */
export default function AiPicksCard() {
  const navigate = useNavigate();
  const { t } = useLocalization();

  return (
    <motion.div
      whileTap={{ scale: 0.99, transition: { duration: 0.15 } }}
      className="relative w-full rounded-[28px] overflow-hidden p-6 cursor-pointer shadow-elevated"
      style={{ background: 'linear-gradient(135deg, #2F1C8F 0%, #6C63FF 100%)' }}
      onClick={() => navigate('/inmood')}
    >
      <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -bottom-12 -left-12 w-32 h-32 rounded-full bg-white/5 blur-2xl" />

      <div className="relative z-10">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-md border border-white/25 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-white text-xl font-bold">{t('discovery.ai_picks.title')}</h2>
        </div>
        <p className="text-white/80 text-sm leading-relaxed mb-5 max-w-[300px]">{t('discovery.ai_picks.subtitle')}</p>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); navigate('/inmood'); }}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-white text-primary text-sm font-semibold shadow-lg active:scale-95 transition-transform duration-200"
        >
          {t('discovery.ai_picks.view_picks')}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}