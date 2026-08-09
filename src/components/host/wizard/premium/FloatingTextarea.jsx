import React, { useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * UI-020 — Premium floating-label textarea.
 */
export default function FloatingTextarea({ label, value, onChange, error, maxLength, rows = 3, placeholder, ...props }) {
  const [focused, setFocused] = useState(false);
  const floated = focused || !!(value && String(value).length > 0);

  return (
    <div>
      <div className="relative">
        <textarea
          value={value || ''}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={focused ? (placeholder || '') : ''}
          maxLength={maxLength}
          rows={rows}
          className={cn(
            'w-full px-4 rounded-2xl bg-card border text-base outline-none transition-all duration-200 resize-none',
            floated ? 'pt-7 pb-3' : 'pt-6 pb-3',
            error
              ? 'border-destructive/40 focus:border-destructive focus:ring-2 focus:ring-destructive/20'
              : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/20'
          )}
          {...props}
        />
        <label
          className={cn(
            'absolute start-4 transition-all duration-200 pointer-events-none',
            floated ? 'top-2.5 text-[11px] font-medium text-primary' : 'top-4 text-sm text-muted-foreground'
          )}
        >
          {label}
        </label>
      </div>
      {error && <p className="text-xs text-destructive mt-1.5 ps-1">{error}</p>}
      {maxLength && (
        <p className="text-xs text-muted-foreground text-end mt-1 ps-1">
          {maxLength - (value || '').length}
        </p>
      )}
    </div>
  );
}