import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import SmartImage from '@/components/shared/SmartImage';
import { useLocalization } from '@/lib/i18n/useLocalization';

/**
 * Nmood Premium hero — edge-to-edge 320px cover, 32px rounded bottom corners,
 * bottom gradient overlay for readability, glass back / share / bookmark buttons.
 */
export default function ExperienceHero({ experience, onBack }) {
  const { t } = useLocalization();
  const { image, title } = experience;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full h-80 overflow-hidden rounded-b-[32px] shadow-card"
    >
      <SmartImage src={image} alt={title} rounded="rounded-none" className="w-full h-full" />
      {/* Bottom gradient for readability + premium depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-black/30 pointer-events-none" />

      {/* Back — top start */}
      <button
        onClick={onBack}
        type="button"
        aria-label={t('experiences.hero.aria_back')}
        className="pressable absolute top-5 start-4 w-11 h-11 rounded-full bg-white/25 backdrop-blur-xl border border-white/30 flex items-center justify-center text-white shadow-float hover:bg-white/35"
      >
        <ArrowLeft className="w-5 h-5" strokeWidth={2.2} />
      </button>

    </motion.div>
  );
}