import { describe, it, expect } from 'vitest';
import { isSafeBackPath } from '@/lib/safe-navigation';

describe('isSafeBackPath — Back may only ever land on a real Nmood route', () => {
  it('accepts concrete app routes and dynamic detail routes', () => {
    ['/', '/explore', '/communities', '/messages', '/profile', '/nmood',
      '/circle/abc', '/experience/42', '/pal/7', '/messages/9'].forEach((p) => {
      expect(isSafeBackPath(p, '/host/create')).toBe(true);
    });
  });

  it('rejects empty, undefined, non-route and external destinations', () => {
    [undefined, null, '', '  ', '/nope', 'explore', '//evil.example.com',
      'https://evil.example.com', 'javascript:alert(1)', '/experience/'].forEach((p) => {
      expect(isSafeBackPath(p, '/host/create')).toBe(false);
    });
  });

  it('rejects the current screen so Back can never loop onto itself', () => {
    expect(isSafeBackPath('/communities', '/communities')).toBe(false);
    expect(isSafeBackPath('/communities/', '/communities')).toBe(false);
  });

  it('ignores query and hash when validating', () => {
    expect(isSafeBackPath('/explore?tab=circles', '/host/create')).toBe(true);
  });
});
