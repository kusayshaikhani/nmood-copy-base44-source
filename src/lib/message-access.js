export function resolveDirectMessageAccess({ connected, blocked, whoCanMessage }) {
  if (blocked) return { connected: false, canMessage: false, reason: 'blocked' };
  const canMessage = Boolean(connected || whoCanMessage === 'everyone');
  return {
    connected: Boolean(connected),
    canMessage,
    reason: canMessage ? null : 'connection_required',
  };
}
