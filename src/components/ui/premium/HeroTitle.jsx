import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Nmood Design System — reusable hero title (40px bold, tight tracking).
 * Used for top-level page heroes.
 */
export default function HeroTitle({ children, className }) {
  return <h1 className={cn('text-hero tracking-tight', className)}>{children}</h1>;
}