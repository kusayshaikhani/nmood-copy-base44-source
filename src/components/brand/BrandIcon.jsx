import React from 'react';
import { useTheme } from '@/lib/ThemeProvider';
import { getBrandAssets } from '@/lib/brand-assets';

const HEIGHTS = {
  sm: 'h-7',
  default: 'h-9',
  lg: 'h-16',
  xl: 'h-20',
};

export default function BrandIcon({ size = 'default', className = '' }) {
  const { theme } = useTheme();
  const assets = getBrandAssets(theme);
  const src = size === 'lg' || size === 'xl' ? assets.icon : assets.iconSmall;
  return (
    <img
      src={src}
      alt="Nmood"
      className={`${HEIGHTS[size] || HEIGHTS.default} w-auto aspect-square object-contain ${className}`}
      draggable={false}
    />
  );
}