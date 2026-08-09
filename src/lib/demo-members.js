/**
 * Demo member detection.
 *
 * Imported showcase members are seeded with a stable email handle of the
 * form `nm-000001@nmood.seed` … `nm-000025@nmood.seed`. These are seeded
 * demo profiles whose public display_name is safe to surface in discovery
 * regardless of the viewer's subscription; the premium lock indicator is
 * suppressed for them. The detection is performed in the data layer only —
 * the UI receives a boolean `is_demo` flag and never the email itself.
 */

const DEMO_EMAIL_RE = /^nm-0*(\d{1,6})@nmood\.seed$/i;
const DEMO_RANGE_MIN = 1;
const DEMO_RANGE_MAX = 25;

/**
 * Extract the numeric demo id from a seeded member email, or null.
 */
export function extractDemoId(email) {
  if (!email) return null;
  const m = DEMO_EMAIL_RE.exec(String(email));
  if (!m) return null;
  return parseInt(m[1], 10);
}

/**
 * True when the member's email marks them as an imported demo member in the
 * NM-000001–NM-000025 range.
 */
export function isDemoMember(email) {
  const n = extractDemoId(email);
  return n != null && n >= DEMO_RANGE_MIN && n <= DEMO_RANGE_MAX;
}