import { useState, useEffect, useCallback } from 'react';
import { MEMBERSHIP_TIERS, getTier, getPermissions, TIER_ORDER } from '@/lib/membership';

const STORAGE_KEY = 'inmood_membership_tier';
const listeners = new Set();

function getStoredTier() {
  try {
    return localStorage.getItem(STORAGE_KEY) || 'basic';
  } catch {
    return 'basic';
  }
}

function setStoredTier(tier) {
  try {
    localStorage.setItem(STORAGE_KEY, tier);
  } catch {
    // ignore
  }
  listeners.forEach((fn) => fn(tier));
}

export function useMembership() {
  const [tier, setTierState] = useState(getStoredTier);

  useEffect(() => {
    const listener = (newTier) => setTierState(newTier);
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, []);

  const setTier = useCallback((newTier) => {
    if (MEMBERSHIP_TIERS[newTier]) {
      setStoredTier(newTier);
    }
  }, []);

  const tierData = getTier(tier);
  const permissions = getPermissions(tier);

  return {
    tier,
    tierData,
    permissions,
    setTier,
    hasPermission: (perm) => !!permissions[perm],
    getLimit: (limit) => permissions[limit],
  };
}