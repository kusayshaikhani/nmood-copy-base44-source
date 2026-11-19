import { callSupabaseRpc } from '@/api/supabaseClient';

export async function joinExperience(experienceId) {
  if (!experienceId) throw new Error('This experience is not available.');
  if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new Error('You appear to be offline. Reconnect and try again.');
  try {
    const result = await callSupabaseRpc('nmood_join_experience', { p_experience_id: String(experienceId) });
    if (!result?.attendance) throw new Error('invalid_response');
    return result;
  } catch (error) {
    const message = String(error?.message || '');
    if (/sign in|profile|blocked|unavailable|closed|full|limit reached|try again after/i.test(message)) throw new Error(message);
    if (error?.code === 'PGRST202') throw new Error('Experience joining is not installed in this rehearsal environment. (NMG-EXPERIENCE-JOIN-RPC)');
    throw new Error('Could not join this experience. Please try again. (NMG-EXPERIENCE-JOIN)');
  }
}

export async function getExperienceAttendanceState(experienceId) {
  return callSupabaseRpc('nmood_get_experience_attendance_state', { p_experience_id: String(experienceId) });
}

export async function respondExperienceAttendance(attendanceId, approve) {
  return callSupabaseRpc('nmood_respond_experience_attendance', { p_attendance_id: String(attendanceId), p_approve: Boolean(approve) });
}

export async function removeExperienceAttendee(attendanceId) {
  return callSupabaseRpc('nmood_remove_experience_attendee', { p_attendance_id: String(attendanceId) });
}
