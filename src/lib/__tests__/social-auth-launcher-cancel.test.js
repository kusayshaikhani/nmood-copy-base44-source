import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { launchSocialAuth } from '@/lib/social-auth-launcher';

function setVisibility(state) {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true });
  document.dispatchEvent(new Event('visibilitychange'));
}

beforeEach(() => {
  vi.useFakeTimers();
  setVisibility('visible');
});

afterEach(() => {
  vi.useRealTimers();
});

describe('launchSocialAuth — cancelled browser', () => {
  it('clears the spinner without an error when the user returns without completing auth', async () => {
    const setLoading = vi.fn();
    const setError = vi.fn();
    const launch = vi.fn().mockResolvedValue(undefined);

    const cleanup = launchSocialAuth({ provider: 'google', setLoading, setError, t: (k) => k, launch });

    // System browser opens — the app goes to the background.
    setVisibility('hidden');
    // User cancels/dismisses the browser and returns without ever
    // completing the OAuth callback.
    setVisibility('visible');

    await vi.advanceTimersByTimeAsync(2100); // past the RETURN_GRACE_MS window

    expect(setLoading).toHaveBeenCalledWith(null);
    expect(setError).not.toHaveBeenCalled();
    cleanup();
  });

  it('shows a bounded timeout error only if the redirect never fires at all', async () => {
    const setLoading = vi.fn();
    const setError = vi.fn();
    const launch = vi.fn().mockResolvedValue(undefined);

    const cleanup = launchSocialAuth({ provider: 'google', setLoading, setError, t: (k) => k, launch });
    // Page never leaves the foreground — the redirect to the system browser
    // never actually fired.
    await vi.advanceTimersByTimeAsync(15100);

    expect(setLoading).toHaveBeenCalledWith(null);
    expect(setError).toHaveBeenCalled();
    cleanup();
  });
});
