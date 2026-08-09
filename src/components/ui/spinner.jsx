import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Nmood Design System — reusable loading spinner.
 * Sizes: sm (16px), md (24px), lg (32px).
 */
const SIZE_CLASSES = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-[3px]',
};

export default function Spinner({ className, size = 'md' }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn('rounded-full border-muted border-t-primary animate-spin', SIZE_CLASSES[size] || SIZE_CLASSES.md, className)}
    />
  );
}