import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabaseAuth, getSupabaseSession, clearSupabaseSession } from '@/api/supabaseClient';

// This vitest/jsdom/Node combination leaves window.localStorage undefined
// (Node's own experimental global `localStorage` shadows jsdom's) — stub a
// minimal in-memory implementation for this file only.
function installMemoryLocalStorage() {
  const store = new Map();
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key) => (store.has(key) ? store.get(key) : null),
      setItem: (key, value) => store.set(key, String(value)),
      removeItem: (key) => store.delete(key),
      clear: () => store.clear(),
    },
  });
}

beforeEach(() => {
  if (typeof window.localStorage === 'undefined') installMemoryLocalStorage();
  clearSupabaseSession();
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ access_token: 'token', refresh_token: 'r', user: { id: 'u1', email: 'a@b.com' } }),
  });
});

describe('supabaseAuth.signInWithIdToken', () => {
  it('posts grant_type=id_token with the provider, identity token, and nonce', async () => {
    await supabaseAuth.signInWithIdToken('apple', 'the-id-token', 'the-raw-nonce');

    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toContain('grant_type=id_token');
    const body = JSON.parse(options.body);
    expect(body).toEqual({ provider: 'apple', id_token: 'the-id-token', nonce: 'the-raw-nonce' });
  });

  it('omits the nonce field entirely when none is provided (Google flow)', async () => {
    await supabaseAuth.signInWithIdToken('google', 'the-id-token');

    const [, options] = global.fetch.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body).toEqual({ provider: 'google', id_token: 'the-id-token' });
    expect(body.nonce).toBeUndefined();
  });

  it('persists the returned session', async () => {
    await supabaseAuth.signInWithIdToken('apple', 'the-id-token', 'nonce');
    expect(getSupabaseSession().access_token).toBe('token');
  });
});
