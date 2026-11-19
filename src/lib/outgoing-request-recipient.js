import { supabaseSelect, callSupabaseRpc } from '@/api/supabaseClient';
import { withTimeout } from '@/lib/bounded-operation';

export async function resolveOutgoingRecipient(requestId, viewerId) {
  if (!requestId || !viewerId) return null;
  try {
    // RLS plus explicit sender ownership: never interpret actor_id (self) as
    // the recipient or use an unverified notification path.
    const rows = await withTimeout(signal => supabaseSelect('pal_requests',
      `select=receiver_id&id=eq.${encodeURIComponent(requestId)}&sender_id=eq.${encodeURIComponent(viewerId)}&limit=1`, { signal }));
    const id = rows?.[0]?.receiver_id;
    if (!id) return null;
    let result;
    try {
      result = await withTimeout(signal => callSupabaseRpc('nmood_get_member_profile', { p_member_id: id }, { signal }));
    } catch { /* An owned request can still be opened in Pals. */ }
    const profile = !result?.blocked && ['full', 'preview', 'teaser'].includes(result?.tier) ? result.profile : null;
    return {
      name: profile?.display_name?.trim() || null,
      avatar: profile?.photo_url || null,
      path: profile ? `/pal/${encodeURIComponent(id)}` : '/pals',
    };
  } catch {
    return null;
  }
}
