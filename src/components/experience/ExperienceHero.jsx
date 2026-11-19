import React from 'react';
import { motion } from 'framer-motion';
import SmartImage from '@/components/shared/SmartImage';

/**
 * Nmood Premium hero — edge-to-edge 320px cover, 32px rounded bottom corners,
 * bottom gradient overlay for readability, glass back / share / bookmark buttons.
 */
export default function ExperienceHero({ experience }) {
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

    </motion.div>
  );
}