/**
 * Global interaction system utilities.
 * Centralises reduced-motion detection and haptic feedback so every
 * surface behaves consistently. UI-only — no business logic.
 */
import { useReducedMotion } from 'framer-motion';

export { useReducedMotion };

/**
 * Triggers a device haptic if available. Respects reduced-motion by
 * skipping the vibration (motion-sensitive users typically prefer no haptics).
 */
export function haptic(level = 'light') {
  if (typeof window === 'undefined') return;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  if (!('vibrate' in navigator)) return;
  const durations = { light: 10, medium: 18, heavy: 28, success: [10, 30, 10] };
  try { navigator.vibrate(durations[level] ?? 10); } catch { /* ignore */ }
}

/**
 * Dispatches a global refresh signal that pages can listen for to reload
 * their data when the user pulls to refresh.
 */
export function emitGlobalRefresh() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('nmood:refresh'));
}

export function onGlobalRefresh(handler) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('nmood:refresh', handler);
  return () => window.removeEventListener('nmood:refresh', handler);
}