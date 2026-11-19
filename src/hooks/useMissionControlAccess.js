import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { canAccessMissionControl } from '@/lib/admin-authorization';
import { checkIsPlatformAdmin } from '@/api/adminData';

/**
 * Reactive Mission Control access for route guards. Returns `{ allowed, loading }`.
 *
 * The authoritative role lives in the Supabase `members` row (AuthContext
 * copies it onto `user.role`). When that role is not present locally the hook
 * asks Supabase directly via `is_platform_admin()`, so access never depends on
 * the retired Base44 workspace-owner lookup. Every admin RPC re-checks the
 * role server-side regardless of what this hook returns.
 */
export function useMissionControlAccess() {
  const { user, isLoadingAuth } = useAuth();
  const [state, setState] = useState({ resolved: false, allowed: false });

  useEffect(() => {
    if (isLoadingAuth) return;

    if (!user) {
      setState({ resolved: true, allowed: false });
      return;
    }

    if (canAccessMissionControl(user, null)) {
      setState({ resolved: true, allowed: true });
      return;
    }

    let active = true;
    checkIsPlatformAdmin().then((allowed) => {
      if (active) setState({ resolved: true, allowed });
    });
    return () => {
      active = false;
    };
  }, [user, isLoadingAuth]);

  return { allowed: state.allowed, loading: !state.resolved };
}