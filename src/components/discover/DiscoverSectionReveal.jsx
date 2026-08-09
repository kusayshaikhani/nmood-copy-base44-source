import React from 'react';
import { motion } from 'framer-motion';

/**
 * UI-004 Phase 4 — Section reveal wrapper.
 * Fades each section upward (20px) as it enters the viewport.
 * Independent staggered entrance, 350ms, once only.
 */
export default function DiscoverSectionReveal({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}