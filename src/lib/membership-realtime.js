import { RealtimeClient } from '@supabase/realtime-js';
import { getSupabaseSession } from '@/api/supabaseClient';
import { supabaseConfig } from '@/config/supabase-config';

// Read-only, own-row subscription. Payload data is never used as authority:
// changes re-fetch the membership RPC. An explicit revocation can only
// withdraw cached access, never grant it.
export function watchMembershipProjection(userId, onChange) {
  if (!userId || !supabaseConfig.baseUrl || !supabaseConfig.publishableKey) return () => {};
  let stopped = false;
  let client;
  const record = error => {
    try { window.NmoodRecovery?.record?.(error, 'MEM-REALTIME'); } catch { /* diagnostics are best effort */ }
  };
  // Realtime is an invalidation hint, not membership authority. A missing or
  // restricted WebSocket must not crash the authenticated React effect.
  const stop = () => {
    if (stopped) return;
    stopped = true;
    if (!client) return;
    try { Promise.resolve(client.removeAllChannels()).catch(record); } catch (error) { record(error); }
    try { Promise.resolve(client.disconnect()).catch(record); } catch (error) { record(error); }
  };
  try {
    client = new RealtimeClient(`${supabaseConfig.baseUrl}/realtime/v1`, {
      params: { apikey: supabaseConfig.publishableKey },
      accessToken: async () => {
        const session = getSupabaseSession();
        return !stopped && session?.user?.id === userId ? session.access_token : null;
      },
      timeout: 8000,
    });
    const changed = payload => {
      if (!stopped) onChange({ revoked: ['explorer', 'expired', 'cancelled', 'refunded'].includes(payload?.new?.entitlement_status) });
    };
    let subscribed = false;
    client.channel(`membership:${userId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'memberships', filter: `member_id=eq.${userId}` }, changed)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'memberships', filter: `member_id=eq.${userId}` }, changed)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'members', filter: `id=eq.${userId}` }, payload => {
        if (!stopped && payload?.new?.role !== payload?.old?.role) onChange({ roleChanged: true });
      })
      .subscribe(status => {
        if (status === 'SUBSCRIBED') { if (subscribed && !stopped) onChange({ revoked: false }); subscribed = true; }
      });
    return stop;
  } catch (error) {
    stop();
    record(error);
    // Initial/foreground/manual server reconciliation remains in the provider.
    return () => {};
  }
}
