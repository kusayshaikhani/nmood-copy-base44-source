import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGuardedCallback } from '@/lib/use-guarded-back';

describe('useGuardedCallback', () => {
  it('fires the callback once for a rapid double-tap in the same tick', () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useGuardedCallback(fn, 'k'));

    act(() => {
      result.current();
      result.current();
    });

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('allows a subsequent call once resetKey changes (e.g. after a step advances)', () => {
    const fn = vi.fn();
    const { result, rerender } = renderHook(
      ({ key }) => useGuardedCallback(fn, key),
      { initialProps: { key: 0 } }
    );

    act(() => { result.current(); });
    expect(fn).toHaveBeenCalledTimes(1);

    // Same key — still locked (simulates a second tap before re-render).
    act(() => { result.current(); });
    expect(fn).toHaveBeenCalledTimes(1);

    // Key changes (step advanced) — guard releases, next tap works again.
    rerender({ key: 1 });
    act(() => { result.current(); });
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('never re-arms on its own without a resetKey change (guards a screen-exit navigation)', () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useGuardedCallback(fn, 'exit'));

    act(() => {
      result.current();
      result.current();
      result.current();
    });

    expect(fn).toHaveBeenCalledTimes(1);
  });
});
