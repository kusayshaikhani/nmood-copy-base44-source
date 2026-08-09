import { useEffect, useCallback } from 'react';

/**
 * DP-002 — Navigation safety for forms with unsaved changes.
 * Wires the browser's beforeunload prompt and exposes a `confirmLeave`
 * helper to intercept in-app closes (Sheet onOpenChange, route changes).
 * Returns { confirmLeave } — call inside your close handler.
 */
export function useUnsavedChanges(isDirty, message = "You have unsaved changes. Leave anyway?") {
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = message;
      return message;
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty, message]);

  const confirmLeave = useCallback(
    (proceed) => {
      if (isDirty && !window.confirm(message)) return false;
      typeof proceed === 'function' && proceed();
      return true;
    },
    [isDirty, message]
  );

  return { confirmLeave };
}