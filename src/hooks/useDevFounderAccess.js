import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';

/**
 * DEV-001 — Resolves whether the current user may use the temporary
 * development-only Hard Delete. The decision is made server-side from the
 * APP_ENV secret + founder/owner identity, so the menu item appears only in a
 * development runtime and disappears automatically in production — no client
 * flag can enable it.
 */
export function useDevFounderAccess() {
  const { user, isLoadingAuth } = useAuth();
  const [isDevFounder, setIsDevFounder] = useState(false);

  useEffect(() => {
    if (isLoadingAuth || !user) {
      setIsDevFounder(false);
      return;
    }
    let active = true;
    base44.functions
      .invoke('adminConsole', { mode: 'devHardDeleteAccess' })
      .then((res) => {
        const allowed = !!(res?.data?.hardDeleteAllowed ?? res?.hardDeleteAllowed);
        if (active) setIsDevFounder(allowed);
      })
      .catch(() => { if (active) setIsDevFounder(false); });
    return () => { active = false; };
  }, [user, isLoadingAuth]);

  return { isDevFounder };
}