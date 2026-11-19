import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { checkIsPlatformAdmin } from '@/api/adminData';
import { supabaseConfig } from '@/config/supabase-config';

// The Edge Function is authoritative. This client gate only hides the
// irreversible action outside rehearsal and from ordinary members.
export function useAdminHardDeleteAccess() {
  const { user, isLoadingAuth } = useAuth();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (isLoadingAuth || !user || supabaseConfig.target !== 'rehearsal') {
      setAllowed(false);
      return;
    }
    let active = true;
    checkIsPlatformAdmin()
      .then((isAdmin) => { if (active) setAllowed(isAdmin); })
      .catch(() => { if (active) setAllowed(false); });
    return () => { active = false; };
  }, [user, isLoadingAuth]);

  return { hardDeleteAllowed: allowed };
}
