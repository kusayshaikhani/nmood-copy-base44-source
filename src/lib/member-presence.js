import { formatDistanceToNow } from 'date-fns';

const EARLIEST_ACTIVITY_MS = Date.UTC(2000, 0, 1);

export function validActivityDate(value, nowMs = Date.now()) {
  if (value == null || value === '') return null;
  const parsed = new Date(value);
  const time = parsed.getTime();
  if (!Number.isFinite(time) || time < EARLIEST_ACTIVITY_MS || time > nowMs) return null;
  return parsed;
}

export function getMemberPresence(member, nowMs = Date.now()) {
  if (!member || member.show_online_status === false) return null;
  const activity = validActivityDate(member.last_active_at, nowMs);
  if (!activity) return member.show_last_seen === true ? 'New here' : null;
  const age = nowMs - activity.getTime();
  if (age <= 60 * 60 * 1000) return 'Online';
  if (member.show_last_seen !== true) return null;
  return `Last seen ${formatDistanceToNow(activity, { addSuffix: true })}`;
}
