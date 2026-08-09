import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DoorOpen, Sparkles } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

/**
 * UI-004 Phase 5 — Signature Magic Door card.
 * Dark glass surface, animated glow, mystery door illustration.
 * Reuses existing /inmood route (Magic Door functionality).
 */
export default function MagicDoorCard() {
  const navigate = useNavigate();
  const { t } = useLocalization();

  return (
    <motion.div
      whileTap={{ scale: 0.99, transition: { duration: 0.15 } }}
      className="relative w-full rounded-[28px] overflow-hidden p-7 cursor-pointer shadow-elevated"
      style={{ background: 'linear-gradient(135deg, #1A0F4A 0%, #2D1B69 50%, #1A0F4A 100%)' }}
      onClick={() => navigate('/inmood')}
    >
      {/* Animated glow orbs */}
      <motion.div
        animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.1, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-primary/30 blur-3xl"
      />
      <motion.div
        animate={{ opacity: [0.2, 0.4, 0.2], scale: [1, 1.15, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute -bottom-16 -left-16 w-40 h-40 rounded-full bg-accent/20 blur-3xl"
      />

      <div className="relative z-10 flex flex-col items-center text-center">
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mb-5"
        >
          <DoorOpen className="w-8 h-8 text-white" strokeWidth={1.5} />
        </motion.div>
        <p className="text-white/70 text-sm font-medium mb-1">{t('discovery.magic_door.question')}</p>
        <h2 className="text-white text-xl font-bold mb-5 max-w-[280px] leading-snug">{t('discovery.magic_door.subtitle')}</h2>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); navigate('/inmood'); }}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-primary text-sm font-bold shadow-lg active:scale-95 transition-transform duration-200"
        >
          <Sparkles className="w-4 h-4" />
          {t('discovery.magic_door.cta')}
        </button>
      </div>
    </motion.div>
  );
}