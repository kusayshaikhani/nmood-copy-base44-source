import {useEffect, useState} from 'react';
import {useAuth} from '@/lib/AuthContext';
import {callSupabaseRpc} from '@/api/supabaseClient';
import {withTimeout} from '@/lib/bounded-operation';
import {moderatorObservationEnabled} from '@/lib/moderator-observation-config';

export function useModeratorObservationAccess() {
  const {user} = useAuth();
  const [approved, setApproved] = useState(null);
  useEffect(() => {
    let active = true;
    setApproved(null);
    if (moderatorObservationEnabled && user?.id) {
      withTimeout(signal => callSupabaseRpc('is_platform_admin', {}, {signal, expectedUserId:user.id}))
        .then(result => {if (active && result === true) setApproved(user.id);})
        .catch(() => {});
    }
    return () => {active = false;};
  }, [user?.id]);
  return {viewerId:user?.id, allowed:moderatorObservationEnabled && !!user?.id && approved === user.id};
}
