import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/api/supabaseClient', () => ({
  restoreSupabaseSessionFromUrl: vi.fn(),
}));

import { restoreSupabaseSessionFromUrl } from '@/api/supabaseClient';
import {
  consumeAuthCallback,
  finalizeAuthCallback,
  isAuthCallbackUrl,
  AUTH_CALLBACK_STAGES,
  readAndClearAuthCallbackResult,
  __resetAuthCallbackCoordinatorForTests,
} from '@/lib/auth-callback-coordinator';

// The active production callback: nmood://auth (double slash — the exact
// form the OAuth provider hands back for Supabase's redirectTo=nmood://auth).
const NATIVE_URL = 'nmood://auth?code=abc123';
// Kept only as harmless, inert defensive parsing — never an active redirect target.
const DORMANT_HTTPS_URL = 'https://app.nmood.app/auth/callback?code=abc123';

beforeEach(() => {
  __resetAuthCallbackCoordinatorForTests();
  restoreSupabaseSessionFromUrl.mockReset();
  window.sessionStorage.clear();
});

describe('isAuthCallbackUrl', () => {
  it('recognizes the active nmood://auth callback', () => {
    expect(isAuthCallbackUrl(NATIVE_URL)).toBe(true);
  });

  it('recognizes the dormant HTTPS path as harmless defensive coverage only', () => {
    expect(isAuthCallbackUrl(DORMANT_HTTPS_URL)).toBe(true);
  });

  it('rejects unrelated URLs (e.g. password recovery)', () => {
    expect(isAuthCallbackUrl('https://app.nmood.app/reset-password?token_hash=x&type=recovery')).toBe(false);
  });
});

describe('consumeAuthCallback — success (one PKCE exchange only)', () => {
  it('exchanges the code exactly once and reports SUCCESS', async () => {
    restoreSupabaseSessionFromUrl.mockResolvedValue({ access_token: 'token' });
    const result = await consumeAuthCallback(NATIVE_URL);
    expect(result.stage).toBe(AUTH_CALLBACK_STAGES.SUCCESS);
    expect(result.session).toEqual({ access_token: 'token' });
    expect(restoreSupabaseSessionFromUrl).toHaveBeenCalledTimes(1);
  });
});

describe('consumeAuthCallback — duplicate delivery (cold launch)', () => {
  it('treats appUrlOpen + getLaunchUrl delivering the same code as one exchange', async () => {
    restoreSupabaseSessionFromUrl.mockResolvedValue({ access_token: 'token' });

    // Simulate a cold launch: both delivery paths fire with the identical URL.
    const [first, second] = await Promise.all([
      consumeAuthCallback(NATIVE_URL),
      consumeAuthCallback(NATIVE_URL),
    ]);

    const stages = [first.stage, second.stage].sort();
    expect(stages).toEqual([AUTH_CALLBACK_STAGES.DUPLICATE, AUTH_CALLBACK_STAGES.SUCCESS].sort());
    expect(restoreSupabaseSessionFromUrl).toHaveBeenCalledTimes(1);
  });

  it('warm launch (single delivery) runs exactly one exchange', async () => {
    restoreSupabaseSessionFromUrl.mockResolvedValue({ access_token: 'token' });
    const result = await consumeAuthCallback(NATIVE_URL);
    expect(result.stage).toBe(AUTH_CALLBACK_STAGES.SUCCESS);
    expect(restoreSupabaseSessionFromUrl).toHaveBeenCalledTimes(1);
  });
});

describe('consumeAuthCallback — already-consumed code', () => {
  it('does not retry the exchange for a second delivery of a used code', async () => {
    restoreSupabaseSessionFromUrl.mockResolvedValueOnce({ access_token: 'token' });
    const first = await consumeAuthCallback(NATIVE_URL);
    expect(first.stage).toBe(AUTH_CALLBACK_STAGES.SUCCESS);

    // A duplicate delivery of the exact same (already-used) code must be a
    // silent no-op — never a second PKCE exchange attempt with a stale/used code.
    const second = await consumeAuthCallback(NATIVE_URL);
    expect(second.stage).toBe(AUTH_CALLBACK_STAGES.DUPLICATE);
    expect(restoreSupabaseSessionFromUrl).toHaveBeenCalledTimes(1);
  });
});

describe('consumeAuthCallback — exchange failure', () => {
  it('reports EXCHANGE_FAILED with a non-sensitive category, never throwing', async () => {
    restoreSupabaseSessionFromUrl.mockRejectedValue(new Error('invalid_grant'));
    const result = await consumeAuthCallback(NATIVE_URL);
    expect(result.stage).toBe(AUTH_CALLBACK_STAGES.EXCHANGE_FAILED);
    expect(result.category).toBeTruthy();
    expect(result.session).toBeNull();
  });
});

describe('finalizeAuthCallback', () => {
  it('stores a real diagnostic (not a bare timeout flag) for a mount that happens later', () => {
    finalizeAuthCallback({ stage: AUTH_CALLBACK_STAGES.EXCHANGE_FAILED, category: 'network_error', session: null });
    const stored = readAndClearAuthCallbackResult();
    expect(stored).toMatchObject({ stage: AUTH_CALLBACK_STAGES.EXCHANGE_FAILED, category: 'network_error' });
    // One-shot: reading again returns null.
    expect(readAndClearAuthCallbackResult()).toBeNull();
  });

  it('does not store anything for a successful callback', () => {
    finalizeAuthCallback({ stage: AUTH_CALLBACK_STAGES.SUCCESS, category: null, session: { access_token: 't' } });
    expect(readAndClearAuthCallbackResult()).toBeNull();
  });

  it('does not store anything for a duplicate/not-a-callback result', () => {
    finalizeAuthCallback({ stage: AUTH_CALLBACK_STAGES.DUPLICATE, category: null, session: null });
    expect(readAndClearAuthCallbackResult()).toBeNull();
  });
});
