import React from 'react';
import { motion } from 'framer-motion';

/**
 * Premium section reveal — slides up + fades in when scrolled into view.
 * Respects prefers-reduced-motion via framer-motion's useReducedMotion.
 */
export default function SectionReveal({ children, delay = 0, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}