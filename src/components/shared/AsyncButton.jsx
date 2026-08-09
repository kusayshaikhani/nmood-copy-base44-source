import React, { useState, useRef } from 'react';
import { Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * DP-001 — Duplicate-click-safe async button.
 * Guarantees a single in-flight invocation (lockRef + disabled), shows
 * loading / success / error states, and never lets a second click through
 * while the action is processing. Works for Explorer/Premium/Business/Admin
 * — the parent decides permissions; this component only guards execution.
 */
export default function AsyncButton({
  onClick,
  children,
  successLabel,
  busyLabel,
  errorLabel = 'Try again',
  className,
  variant,
  size,
  disabled,
  ...rest
}) {
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const lockRef = useRef(false);

  const handle = async (e) => {
    if (lockRef.current || disabled) return;
    lockRef.current = true;
    setStatus('loading');
    try {
      await onClick?.(e);
      if (successLabel) {
        setStatus('success');
        setTimeout(() => setStatus('idle'), 1500);
      } else {
        setStatus('idle');
      }
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 1500);
    } finally {
      lockRef.current = false;
    }
  };

  const isBusy = status === 'loading';
  return (
    <Button
      {...rest}
      variant={variant}
      size={size}
      className={className}
      disabled={disabled || isBusy || status === 'success'}
      onClick={handle}
      aria-busy={isBusy}
    >
      {isBusy ? (
        <><Loader2 className="w-4 h-4 animate-spin" /> {busyLabel || 'Please wait'}</>
      ) : status === 'success' ? (
        <><Check className="w-4 h-4" /> {successLabel}</>
      ) : status === 'error' ? (
        errorLabel
      ) : (
        children
      )}
    </Button>
  );
}