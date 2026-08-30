// Shared capacity semantics for Circles and Experiences.
//
// Unlimited capacity is stored as null (never 0, 100, or a large sentinel).
// Legacy rows that used 0/undefined are read as unlimited too, which matches
// the server-side join checks (`if (max && count >= max)`).

export const UNLIMITED_CAPACITY = null;

export function isUnlimitedCapacity(max) {
  return max === null || max === undefined || max === '' || Number(max) === 0;
}

/** Remaining spots, or null when the capacity is unlimited. */
export function spotsRemaining(max, filled) {
  if (isUnlimitedCapacity(max)) return null;
  return Math.max(0, Number(max) - (Number(filled) || 0));
}

/** Whether joining should be blocked / waitlisted. Unlimited is never full. */
export function isAtCapacity(max, filled) {
  if (isUnlimitedCapacity(max)) return false;
  return (Number(filled) || 0) >= Number(max);
}

/** Fill percentage, or null when unlimited (no meaningful denominator). */
export function fillPercent(max, filled) {
  if (isUnlimitedCapacity(max)) return null;
  const total = Number(max);
  if (!total) return null;
  return Math.min(100, Math.round(((Number(filled) || 0) / total) * 100));
}

/** Normalizes a wizard/edit-form value into the stored capacity value. */
export function normalizeCapacityInput(value) {
  if (isUnlimitedCapacity(value)) return UNLIMITED_CAPACITY;
  const num = parseInt(value, 10);
  if (Number.isNaN(num) || num < 1) return UNLIMITED_CAPACITY;
  return num;
}
