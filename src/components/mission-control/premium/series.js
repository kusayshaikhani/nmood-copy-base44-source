/**
 * UI-025 — Pure presentation helpers for the Mission Control dashboard.
 * These derive sparkline series and trend deltas from already-loaded entity
 * arrays (real timestamps). No backend or analytics logic is touched.
 */
const DAY = 86400000;

export function dayBuckets(arr, dateField, days = 14) {
  if (!Array.isArray(arr)) return new Array(days).fill(0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = today.getTime() - (days - 1) * DAY;
  const counts = new Array(days).fill(0);
  arr.forEach((x) => {
    const t = x[dateField] ? new Date(x[dateField]).getTime() : 0;
    if (t >= start) {
      const idx = Math.floor((t - start) / DAY);
      if (idx >= 0 && idx < days) counts[idx]++;
    }
  });
  return counts;
}

export function trendFor(series) {
  if (!series || series.length < 14) return { dir: 'flat', pct: 0 };
  const last = series.slice(-7).reduce((a, b) => a + b, 0);
  const prev = series.slice(-14, -7).reduce((a, b) => a + b, 0);
  if (prev === 0) return last > 0 ? { dir: 'up', pct: 100 } : { dir: 'flat', pct: 0 };
  const pct = Math.round(((last - prev) / prev) * 100);
  return { dir: pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat', pct: Math.abs(pct) };
}

export function buildGrowthSeries(members, experiences, circles, days = 14) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = today.getTime() - (days - 1) * DAY;
  const rows = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(start + i * DAY);
    rows.push({
      day: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      signups: 0,
      experiences: 0,
      circles: 0,
    });
  }
  const bucket = (arr, field, key) => {
    if (!Array.isArray(arr)) return;
    arr.forEach((x) => {
      const t = x[field] ? new Date(x[field]).getTime() : 0;
      if (t >= start) {
        const idx = Math.floor((t - start) / DAY);
        if (idx >= 0 && idx < days) rows[idx][key]++;
      }
    });
  };
  bucket(members, 'created_date', 'signups');
  bucket(experiences, 'created_date', 'experiences');
  bucket(circles, 'created_date', 'circles');
  return rows;
}