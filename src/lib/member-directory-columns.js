export const MEMBER_DIRECTORY_DEFAULT_COLUMNS = [
  'name', 'member_id', 'email', 'country', 'city', 'language', 'membership',
  'trust', 'verified', 'status', 'created_date', 'last_active', 'online',
];

export function normaliseVisibleMemberColumns(value) {
  const selected = Array.isArray(value) ? value.filter((key) => MEMBER_DIRECTORY_DEFAULT_COLUMNS.includes(key)) : [];
  return selected.length ? [...new Set(selected)] : MEMBER_DIRECTORY_DEFAULT_COLUMNS;
}

export function toggleVisibleMemberColumn(current, key) {
  const selected = normaliseVisibleMemberColumns(current);
  if (selected.includes(key)) return selected.length > 1 ? selected.filter((item) => item !== key) : selected;
  return MEMBER_DIRECTORY_DEFAULT_COLUMNS.filter((item) => selected.includes(item) || item === key);
}
