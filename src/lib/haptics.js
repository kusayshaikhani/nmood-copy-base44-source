import { useCallback } from 'react';

// Subtle haptic feedback for mobile only. Desktop is a no-op so behaviour
// there stays unchanged. Respects pointer:coarse so desktop touchscreens
// aren't误-triggered, and silently skips when the Vibration API is absent
// (e.g. iOS Safari).

const supportsVibration = () =>
  typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';

const isCoarsePointer = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(pointer: coarse)').matches;

const canHaptic = () => supportsVibration() && isCoarsePointer();

export const HAPTIC_PATTERNS = {
  light: 10,
  selection: 8,
  success: [12, 28, 12],
  warning: [18, 50, 18],
  error: [40, 40, 40],
};

export function haptic(type = 'light') {
  if (!canHaptic()) return;
  const pattern = HAPTIC_PATTERNS[type] ?? HAPTIC_PATTERNS.light;
  try {
    navigator.vibrate(pattern);
  } catch {
    // ignore — haptics are best-effort
  }
}

export function useHaptic() {
  return useCallback((type) => haptic(type), []);
}