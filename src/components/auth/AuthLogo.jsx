import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { BRAND_LOGO } from '@/lib/brand-assets';

// Shared Nmood wordmark for all authentication screens.
// Uses the WHITE wordmark so it reads clearly against the Nmood purple
// gradient background. The image is transparent (no white/colored rectangle
// behind it) — just the white logotype.
export function getAuthLogoMotion(reduceMotion) {
  if (reduceMotion) {
    return { animate: undefined, transition: undefined };
  }

  return {
    animate: {
      y: [-2, 2, -2],
      scale: [1, 1.015, 1],
      filter: [
        'drop-shadow(0 0 5px rgba(255,255,255,0.18))',
        'drop-shadow(0 0 11px rgba(255,255,255,0.34))',
        'drop-shadow(0 0 5px rgba(255,255,255,0.18))',
      ],
    },
    transition: { duration: 7, ease: 'easeInOut', repeat: Infinity },
  };
}

export default function AuthLogo({ className = 'h-10 sm:h-12', animated = false }) {
  const reduceMotion = useReducedMotion();
  const logoMotion = animated ? getAuthLogoMotion(reduceMotion) : {};

  return (
    <motion.img
      src={BRAND_LOGO.dark.full}
      alt="Nmood"
      className={`${className} w-auto object-contain`}
      draggable={false}
      initial={false}
      data-auth-logo-motion={animated && !reduceMotion ? 'active' : 'static'}
      {...logoMotion}
    />
  );
}
