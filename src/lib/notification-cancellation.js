/**
 * Filters cancelled connection-request activity before the notification centre
 * derives unread counts or tabbed lists. The server remains responsible for
 * transactional deletion/suppression; this protects the client during refresh.
 */
export function suppressCancelledConnectionRequestNotifications(rows = []) {
  const safeRows = Array.isArray(rows) ? rows : [];
  const cancelled = new Set(safeRows
    .filter(row => row?.event_type === 'connection_cancelled' && row.source_id)
    .map(row => String(row.source_id)));
  return safeRows.filter(row => !(row?.event_type === 'connection_cancelled'
    || (row?.event_type === 'connection_request' && cancelled.has(String(row.source_id)))));
}
