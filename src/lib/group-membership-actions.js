import { callSupabaseRpc } from '@/api/supabaseClient';

const OFFLINE_MESSAGE = 'You appear to be offline. Reconnect and try again.';
const SAFE_LEAVE_MESSAGES = new Set([
  'Please sign in to continue.',
  'This circle is not available.',
  'Transfer Circle ownership before leaving.',
  'This experience is not available.',
  'Transfer Experience ownership before leaving.',
]);

function assertOnline() {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new Error(OFFLINE_MESSAGE);
}

function safeLeaveError(error, scope) {
  const message = typeof error?.message === 'string' ? error.message.trim() : '';
  if (message === OFFLINE_MESSAGE || SAFE_LEAVE_MESSAGES.has(message)) return message;
  if (error?.code === 'PGRST202') return `${scope} leaving is not installed in this rehearsal environment. (NMG-${scope.toUpperCase()}-LEAVE-RPC)`;
  return `Could not leave this ${scope}. Please try again. (NMG-${scope.toUpperCase()}-LEAVE)`;
}

async function leave(rpc, parameter, id, scope) {
  if (!id) throw new Error(`This ${scope} is not available.`);
  try {
    assertOnline();
    const result = await callSupabaseRpc(rpc, { [parameter]: String(id) });
    if (!result?.ok || !['left', 'already_left'].includes(result.status)) throw new Error();
    return result;
  } catch (error) {
    throw new Error(safeLeaveError(error, scope));
  }
}

export const leaveCircle = (circleId) => leave('nmood_leave_circle', 'p_circle_id', circleId, 'circle');
export const leaveExperience = (experienceId) => leave('nmood_leave_experience', 'p_experience_id', experienceId, 'experience');
