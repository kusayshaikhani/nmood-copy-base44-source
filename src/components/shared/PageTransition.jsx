import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * PageTransition
 *
 * IMPORTANT:
 * Do NOT apply x/y/scale transforms to this wrapper.
 *
 * A transformed ancestor changes the containing block of descendants using
 * position: fixed. CircleDetail contains a bottom CTA that must remain
 * positioned relative to the actual viewport / app shell.
 *
 * Therefore page transitions use opacity only.
 */
export default function PageTransition({ children, className = '' }) {
  const reduce = useReducedMotion();

  if (reduce) {
    return (
      <div className={className}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        duration: 0.2,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={className}
      style={{
        width: '100%',
        minWidth: 0,
      }}
    >
      {children}
    </motion.div>
  );
}