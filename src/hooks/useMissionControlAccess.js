import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import {
  canAccessMissionControl,
  getWorkspaceOwnerId,
  isDevelopmentMode,
  resetWorkspaceOwnerCache,
} from '@/lib/admin-authorization';

/**
 * ADM-001 — Reactive Mission Control access for route guards.
 * Returns `{ allowed, loading }`. Resolves synchronously for Founder/Admin
 * roles and only hits the server for the development owner override.
 */
export function useMissionControlAccess() {
  const { user, isLoadingAuth } = useAuth();
  const [state, setState] = useState({ resolved: false, allowed: false });

  useEffect(() => {
    if (isLoadingAuth) return;

    if (!user) {
      resetWorkspaceOwnerCache();
      setState({ resolved: true, allowed: false });
      return;
    }

    // Role-based tiers resolve immediately (no server round-trip).
    if (canAccessMissionControl(user, null)) {
      setState({ resolved: true, allowed: true });
      return;
    }

    // The development override is the only tier that needs the owner id; in
    // production it is skipped entirely.
    if (!isDevelopmentMode()) {
      setState({ resolved: true, allowed: false });
      return;
    }

    let active = true;
    getWorkspaceOwnerId().then((ownerId) => {
      if (active) setState({ resolved: true, allowed: canAccessMissionControl(user, ownerId) });
    });
    return () => {
      active = false;
    };
  }, [user, isLoadingAuth]);

  return { allowed: state.allowed, loading: !state.resolved };
}