import { useEffect, useRef } from 'react';
import { purgeAccessToken } from '@/lib/auth-session';

/**
 * Sign out from a gate screen (DOB, underage, onboarding, error).
 *
 * Clears only Nmood transient auth state — the access token from URL and
 * localStorage — then delegates to AuthContext.logout(), which terminates
 * the Base44 server session and hard-redirects to /auth. Never clears user
 * preferences, language, consent, or any other app state.
 *
 * @param {Function} logout - AuthContext.logout (terminates the Base44 session).
 */
export function signOutFromGate(logout) {
  try { purgeAccessToken(); } catch { /* storage unavailable */ }
  logout();
}

/**
 * Ensure the Android hardware back button escapes a gate to login instead
 * of trapping the user or reopening the gate.
 *
 * On mount, pushes a sentinel history entry. When popstate fires (back
 * pressed), calls onEscape — which should sign out and redirect to /auth.
 * This guarantees a clean session termination rather than a bare back
 * navigation that might auto-login again from a lingering session cookie.
 *
 * Uses a ref so onEscape can change every render without re-running the
 * effect (the sentinel must be pushed exactly once per gate mount).
 *
 * @param {Function} onEscape - Called when Android back is pressed on the gate.
 */
export function useGateBackToLogin(onEscape) {
  const ref = useRef(onEscape);
  ref.current = onEscape;

  useEffect(() => {
    try {
      window.history.pushState({ nmoodGateEscape: true }, '');
    } catch { /* history unavailable */ }

    const onPopState = () => {
      ref.current();
    };

    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
    };
  }, []);
}