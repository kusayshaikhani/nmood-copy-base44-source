import React from 'react';
import { motion } from 'framer-motion';

/**
 * UI-008 — Animated section wrapper for the Profile page.
 * Scroll-triggered fade/slide-in, once per section. Purely presentational.
 */
export default function ProfileSection({ children, id, className = '' }) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.section>
  );
}