import React, { useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * UI-020 — Premium floating-label input.
 * Label floats up when focused or has a value. Large, comfortable spacing.
 */
export default function FloatingInput({ label, value, onChange, error, maxLength, type = 'text', placeholder, ...props }) {
  const [focused, setFocused] = useState(false);
  const floated = focused || !!(value && String(value).length > 0);

  return (
    <div>
      <div className="relative">
        <input
          type={type}
          value={value || ''}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={focused ? (placeholder || '') : ''}
          maxLength={maxLength}
          className={cn(
            'w-full h-14 px-4 rounded-2xl bg-card border text-base outline-none transition-all duration-200',
            floated ? 'pt-6 pb-2' : 'pt-5 pb-2',
            error
              ? 'border-destructive/40 focus:border-destructive focus:ring-2 focus:ring-destructive/20'
              : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/20'
          )}
          {...props}
        />
        <label
          className={cn(
            'absolute start-4 transition-all duration-200 pointer-events-none',
            floated ? 'top-2 text-[11px] font-medium text-primary' : 'top-4 text-sm text-muted-foreground'
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