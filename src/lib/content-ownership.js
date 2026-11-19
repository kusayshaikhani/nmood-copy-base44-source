export function sameUserId(left, right) {
  return Boolean(left && right && String(left) === String(right));
}

// app_records.owner_id is the persisted creator identity. The legacy host and
// creator fields remain supported for records written before app_records.
export function isRecordOwner(record, userId) {
  if (!record || !userId) return false;
  // Prefer canonical ownership fields. Legacy fields apply only when canonical data is absent.
  if (record.owner_id != null) return sameUserId(record.owner_id, userId);
  if (record.host_user_id != null) return sameUserId(record.host_user_id, userId);
  if (record.host_id != null) return sameUserId(record.host_id, userId);
  if (record.created_by_id != null) return sameUserId(record.created_by_id, userId);
  return sameUserId(record.user_id, userId);
}