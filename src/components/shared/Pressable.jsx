import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * Pressable — premium tap wrapper for cards and list items.
 * Applies a spring scale-down on press and a soft elevation lift,
 * then springs back. Respects prefers-reduced-motion (no transform).
 *
 * For buttons, the global CSS in index.css already handles the 0.98
 * scale + spring release — no wrapper needed.
 */
export default function Pressable({
  children,
  className = '',
  scale = 0.97,
  lift = true,
  onClick,
  ...props
}) {
  const reduce = useReducedMotion();

  if (reduce) {
    return (
      <div className={className} onClick={onClick} {...props}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      whileTap={{ scale }}
      whileHover={lift ? { y: -2 } : undefined}
      transition={{ type: 'spring', stiffness: 500, damping: 32, mass: 0.5 }}
      className={className}
      onClick={onClick}
      {...props}
    >
      {children}
    </motion.div>
  );
}