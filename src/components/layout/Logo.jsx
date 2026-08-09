import React from 'react';
import BrandIcon from '@/components/brand/BrandIcon';
import BrandLogo from '@/components/brand/BrandLogo';

export default function Logo({ collapsed = false, size = 'default' }) {
  if (collapsed) return <BrandIcon size={size} />;
  return <BrandLogo size={size} />;
}