import React, { useEffect } from 'react';
import { useTheme } from '@/lib/ThemeProvider';
import { getBrandAssets, BRAND_LOGO } from '@/lib/brand-assets';

const HEIGHTS = {
  sm: 'h-7',
  default: 'h-9',
  lg: 'h-12',
  xl: 'h-16',
};

// Preload both theme variants once so the logo swaps instantly with no flash.
let preloaded = false;
function preloadLogos() {
  if (preloaded) return;
  preloaded = true;
  [BRAND_LOGO.light.full, BRAND_LOGO.dark.full].forEach((url) => {
    const img = new Image();
    img.src = url;
  });
}

export default function BrandLogo({ size = 'default', className = '' }) {
  const { theme } = useTheme();
  const assets = getBrandAssets(theme);

  useEffect(() => { preloadLogos(); }, []);

  return (
    <img
      src={assets.fullLogo}
      alt="Nmood"
      className={`${HEIGHTS[size] || HEIGHTS.default} w-auto object-contain ${className}`}
      draggable={false}
    />
  );
}