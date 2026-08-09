import { useState, useEffect, useCallback } from 'react';

/**
 * BUG-003 — Persist discovery filters & privacy preferences to localStorage.
 * Restores automatically on mount; survives refresh and app restart.
 */
const FILTERS_KEY = 'inmood_discovery_filters';
const PRIVACY_KEY = 'inmood_discovery_privacy';

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function useDiscoveryFilters(initialFilters = {}, initialPrivacy = null) {
  const [filters, setFilters] = useState(() => readJSON(FILTERS_KEY, initialFilters));
  const [privacy, setPrivacy] = useState(() => readJSON(PRIVACY_KEY, initialPrivacy));

  useEffect(() => {
    try { localStorage.setItem(FILTERS_KEY, JSON.stringify(filters)); } catch { /* ignore */ }
  }, [filters]);

  useEffect(() => {
    if (privacy) {
      try { localStorage.setItem(PRIVACY_KEY, JSON.stringify(privacy)); } catch { /* ignore */ }
    }
  }, [privacy]);

  const clearFilters = useCallback(() => setFilters({}), []);

  return { filters, setFilters, privacy, setPrivacy, clearFilters };
}