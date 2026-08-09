/**
 * MP-007.2 — Central relationship state for connection UI.
 * Pure helpers + a hook that derives the relationship to a given member from
 * the shared connections store + safety store. Every surface that shows a
 * Connect button reads the same state, so changes propagate in real time
 * (the stores are already subscribed to PalRequest / PalConnection / BlockedMember).
 */
import { useMemo } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useConnections } from '@/lib/connections-store';
import { useSafety } from '@/lib/safety-store';

export const RELATIONSHIP_STATES = {
  NOT_CONNECTED: 'not_connected',
  REQUEST_SENT: 'request_sent',
  REQUEST_RECEIVED: 'request_received',
  CONNECTED: 'connected',
  BLOCKED: 'blocked',
};

export function getRelationship(memberUserId, { connections, outgoing, incoming, isBlocked }) {
  if (!memberUserId) return RELATIONSHIP_STATES.NOT_CONNECTED;
  const uid = String(memberUserId);
  if (isBlocked && isBlocked(uid)) return RELATIONSHIP_STATES.BLOCKED;
  if ((connections || []).some((c) => String(c.pal_user_id) === uid && c.is_active !== false)) return RELATIONSHIP_STATES.CONNECTED;
  if ((outgoing || []).some((r) => String(r.receiver_user_id) === uid && r.status === 'pending')) return RELATIONSHIP_STATES.REQUEST_SENT;
  if ((incoming || []).some((r) => String(r.sender_user_id) === uid && r.status === 'pending')) return RELATIONSHIP_STATES.REQUEST_RECEIVED;
  return RELATIONSHIP_STATES.NOT_CONNECTED;
}

/**
 * ms until the next Explorer connection slot opens (72h sliding window).
 * Returns 0 if a slot is already available.
 */
export function nextAvailableMs(membership, windowHours = 72, nowMs = Date.now()) {
  const arr = Array.isArray(membership?.connection_requests) ? membership.connection_requests : [];
  const windowMs = windowHours * 3600000;
  const recent = arr
    .map((ts) => new Date(ts).getTime())
    .filter((t) => Number.isFinite(t) && nowMs - t < windowMs)
    .sort((a, b) => a - b);
  if (recent.length === 0) return 0;
  const remaining = recent[0] + windowMs - nowMs;
  return remaining > 0 ? remaining : 0;
}

export function formatCountdown(ms) {
  if (ms <= 0) return 'now';
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

export function useRelationship(memberUserId) {
  const { user } = useAuth();
  const conn = useConnections(user);
  const { isBlocked } = useSafety();
  return useMemo(
    () => getRelationship(memberUserId, { connections: conn.connections, outgoing: conn.outgoing, incoming: conn.incoming, isBlocked }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [memberUserId, conn.connections, conn.outgoing, conn.incoming, isBlocked]
  );
}