import { useState, useEffect } from 'react';

/**
 * BUG-004 — Persist search UI state (category, filters, sort, view mode) to
 * sessionStorage so the Search page restores exactly where the user left off
 * when they navigate away and come back. Query text is persisted separately
 * in the Search component.
 */
const STATE_KEY = 'inmood_search_state';

function readJSON(key, fallback) {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function useSearchState(defaults) {
  const [state, setState] = useState(() => ({ ...defaults, ...readJSON(STATE_KEY, {}) }));

  useEffect(() => {
    try { sessionStorage.setItem(STATE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
  }, [state]);

  return [state, setState];
}