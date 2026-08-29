import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockIsNative = false;
vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => mockIsNative },
}));
vi.mock('@capacitor/browser', () => ({
  Browser: { open: vi.fn().mockResolvedValue(undefined), close: vi.fn().mockResolvedValue(undefined) },
}));

import { Browser } from '@capacitor/browser';
import { supabaseAuth } from '@/api/supabaseClient';

function redirectToUsedFor(provider) {
  if (mockIsNative) {
    const openedUrl = Browser.open.mock.calls.at(-1)[0].url;
    return new URL(openedUrl).searchParams.get('redirect_to');
  }
  const assignedUrl = window.location.assign.mock.calls.at(-1)[0];
  return new URL(assignedUrl).searchParams.get('redirect_to');
}

beforeEach(() => {
  Browser.open.mockClear();
  // jsdom's window.location.assign is non-configurable — replace the whole
  // location object (this test file's own jsdom window) with a stub instead.
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { ...window.location, assign: vi.fn() },
  });
});

describe('OAuth redirect target — nmood://auth is the only active destination', () => {
  it('uses nmood://auth for Google on native', async () => {
    mockIsNative = true;
    await supabaseAuth.signInWithOAuth('google');
    expect(redirectToUsedFor('google')).toBe('nmood://auth');
  });

  it('uses nmood://auth for Apple on native', async () => {
    mockIsNative = true;
    await supabaseAuth.signInWithOAuth('apple');
    expect(redirectToUsedFor('apple')).toBe('nmood://auth');
  });

  it('never requests the HTTPS website as the OAuth redirect target', async () => {
    mockIsNative = true;
    await supabaseAuth.signInWithOAuth('google');
    const redirectTo = redirectToUsedFor('google');
    expect(redirectTo).not.toContain('app.nmood.app');
    expect(redirectTo).not.toContain('/auth/callback');
  });

  it('still targets nmood://auth even outside the native shell', async () => {
    mockIsNative = false;
    await supabaseAuth.signInWithOAuth('google');
    expect(redirectToUsedFor('google')).toBe('nmood://auth');
  });
});
