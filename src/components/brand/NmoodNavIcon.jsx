import React from 'react';
import { NAV_N_MARK } from '@/lib/brand-assets';

/**
 * Uses the approved local transparent mark directly so the symbol keeps its
 * exact bright artwork in web and native WebViews.
 */
export default function NmoodNavIcon({ size = 20, active = false }) {
  return (
    <img
      role="img"
      aria-label="Nmood"
      src={NAV_N_MARK}
      alt="Nmood"
      className="inline-block object-contain"
      style={{
        width: size,
        height: size,
      }}
    />
  );
}