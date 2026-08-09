// RM-003 Immutable audit logging (client). Writes structured audit entries via
// the systemOps writeAudit endpoint (admin-only). Each entry records the
// actor (resolved server-side from the session), action, affected entity, and
// previous/new values. Append-only — entries are never edited or deleted.
import { base44 } from '@/api/base44Client';

export async function writeAudit({
  action,
  targetType = '',
  targetId = '',
  previousValue,
  newValue,
  details = '',
}) {
  try {
    await base44.functions.invoke('systemOps', {
      mode: 'writeAudit',
      action,
      target_type: targetType,
      target_id: targetId,
      previous_value: previousValue,
      new_value: newValue,
      details,
    });
  } catch {
    // audit write failure must never break the calling action
  }
  return true;
}