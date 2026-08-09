import React from 'react';
import { cn } from '@/lib/utils';

/**
 * UI-025 — Standard frosted-glass section card for Mission Control.
 */
export default function PremiumGlassCard({ icon: Icon, title, action, children, className = '', bodyClass = '' }) {
  return (
    <div className={cn('rounded-card glass shadow-card p-5 animate-fade-in-up', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            {Icon && <Icon className="w-4 h-4 text-primary" />}
            {title}
          </h3>
          {action}
        </div>
      )}
      <div className={bodyClass}>{children}</div>
    </div>
  );
}