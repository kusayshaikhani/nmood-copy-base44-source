import { useState, useCallback, useRef } from 'react';

/**
 * useOptimisticAction — immediate optimistic feedback for social actions.
 *
 * Pattern:
 * 1. Apply optimistic state update immediately (UI responds instantly)
 * 2. Prevent duplicate submissions via an in-flight guard
 * 3. Execute the server action in the background
 * 4. On success: reconcile (keep optimistic state or apply server result)
 * 5. On failure: roll back optimistic state and call onError
 *
 * Usage:
 *   const { pending, execute } = useOptimisticAction();
 *   await execute({
 *     optimisticUpdate: () => setSaved(true),
 *     action: () => api.save(experienceId),
 *     onSuccess: (result) => refresh(),
 *     onError: () => { setSaved(false); toast({ title: 'Failed to save' }); },
 *   });
 *
 * @returns {{ pending: boolean, execute: Function, reset: Function }}
 */
export function useOptimisticAction() {
  const [pending, setPending] = useState(false);
  const inFlightRef = useRef(false);

  const execute = useCallback(async ({ optimisticUpdate, action, onSuccess, onError }) => {
    // Prevent duplicate submissions.
    if (inFlightRef.current) return null;
    inFlightRef.current = true;
    setPending(true);

    // Apply optimistic update immediately so the UI responds instantly.
    if (optimisticUpdate) optimisticUpdate();

    try {
      const result = await action();
      if (onSuccess) onSuccess(result);
      return result;
    } catch (error) {
      // Roll back — the caller's onError handler should restore prior state.
      if (onError) onError(error);
      return null;
    } finally {
      inFlightRef.current = false;
      setPending(false);
    }
  }, []);

  const reset = useCallback(() => {
    inFlightRef.current = false;
    setPending(false);
  }, []);

  return { pending, execute, reset };
}