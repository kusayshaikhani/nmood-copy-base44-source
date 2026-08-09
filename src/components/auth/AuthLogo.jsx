import React from 'react';
import { BRAND_LOGO } from '@/lib/brand-assets';

// Shared Nmood wordmark for all authentication screens.
// Uses the WHITE wordmark so it reads clearly against the Nmood purple
// gradient background. The image is transparent (no white/colored rectangle
// behind it) — just the white logotype.
export default function AuthLogo({ className = 'h-10 sm:h-12' }) {
  return (
    <img
      src={BRAND_LOGO.dark.full}
      alt="Nmood"
      className={`${className} w-auto object-contain`}
      draggable={false}
    />
  );
}