// Ordering only: callers must supply the existing server-authorized, scoped rows.
// Retaining older rows fills a recent-first section without widening its scope.
export function newestFirst(items = []) {
 const time = item => {
  const value = Date.parse(item.created_at || item.created_date || '');
  return Number.isFinite(value) ? value : -Infinity;
 };
 return [...items].sort((a,b) => (time(b)-time(a) || String(b.id||'').localeCompare(String(a.id||''))));
}
