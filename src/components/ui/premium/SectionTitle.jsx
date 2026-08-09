import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Nmood Design System — reusable section title (30px bold) with an optional
 * trailing action (e.g. "See all"). Standardizes section headers app-wide.
 */
export default function SectionTitle({ children, action, className }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className={cn('text-section-title text-foreground', className)}>{children}</h2>
      {action}
    </div>
  );
}