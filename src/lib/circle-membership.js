import { callSupabaseRpc } from '@/api/supabaseClient';

const SAFE_JOIN_MESSAGES = new Set([
  'Please sign in to continue.',
  'Complete your profile before joining a circle.',
  'This circle is not available.',
  'This circle is not currently active.',
  'Registrations are closed for this circle.',
  'This circle is full.',
  'This circle is invitation-only.',
  'Your invitation to this circle has expired.',
  'You are banned from this circle.',
  'You can’t join this circle.',
  'Circle join limit reached. Upgrade to Premium for unlimited joins.',
]);

export function safeCircleJoinError(error) {
  const message = typeof error?.message === 'string' ? error.message.trim() : '';
  if (message === 'Circle join limit reached. Upgrade to Premium for unlimited joins.') return 'Your shared request allowance is used. Premium includes continued participation.';
  if (SAFE_JOIN_MESSAGES.has(message)) return message;
  if (error?.code === 'PGRST202') return 'Circle joining is not installed in this rehearsal environment. (NMG-CIRCLE-RPC)';
  return 'Could not join this circle. Please try again. (NMG-CIRCLE-JOIN)';
}

export async function getCircleMembershipState(circleId) {
  if (!circleId) return { members: [], isOrganizer: false };
  const result = await callSupabaseRpc('nmood_get_circle_membership_state', {
    p_circle_id: String(circleId),
  });
  return {
    members: Array.isArray(result?.members) ? result.members : [],
    isOrganizer: result?.isOrganizer === true,
  };
}

export async function joinCircle(circleId) {
  if (!circleId) throw new Error('This circle is not available.');
  try {
    const result = await callSupabaseRpc('nmood_join_circle', {
      p_circle_id: String(circleId),
    });
    if (!result?.membership) throw new Error('Could not join this circle. Please try again.');
    return result;
  } catch (error) {
    throw new Error(safeCircleJoinError(error));
  }
}

export async function respondCircleMembership(membershipId, approve) {
  return callSupabaseRpc('nmood_respond_record_membership', { p_membership_id: String(membershipId), p_approve: Boolean(approve) });
}

export async function removeCircleMembership(membershipId) {
  return callSupabaseRpc('nmood_remove_circle_member', { p_membership_id: String(membershipId) });
}

export function setCircleAdministrator(membershipId, administrator) {
 return callSupabaseRpc('nmood_set_circle_administrator', {p_membership_id:String(membershipId),p_administrator:Boolean(administrator)});
}
