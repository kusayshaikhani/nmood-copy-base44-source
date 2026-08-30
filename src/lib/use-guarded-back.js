import { useRef, useCallback, useEffect } from 'react';

// Debounces a callback so a rapid double-tap can't fire it twice before
// React has re-rendered with an updated guarding condition (e.g. a step
// index). This is what protects a screen's back button from sending two
// navigation calls back-to-back in the same tick — the confirmed crash path
// shared by Create Circle and Create Experience's back arrow.
//
// `resetKey` releases the guard once it changes (e.g. after an in-page step
// actually advances), so the next tap works normally. Pass a constant when
// the callback always leaves the screen (no need to ever re-arm).
export function useGuardedCallback(callback, resetKey) {
  const lockedRef = useRef(false);

  useEffect(() => {
    lockedRef.current = false;
  }, [resetKey]);

  return useCallback((...args) => {
    if (lockedRef.current) return;
    lockedRef.current = true;
    callback(...args);
  }, [callback]);
}
