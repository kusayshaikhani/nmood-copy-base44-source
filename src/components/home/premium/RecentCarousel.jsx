import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const WINDOW_MS = 72 * 60 * 60 * 1000;
export function recentlyCreated(items, now = Date.now()) {
  return items.filter(item => {
    const created = Date.parse(item.created_at || item.created_date || '');
    return Number.isFinite(created) && created <= now && now - created <= WINDOW_MS;
  }).sort((a, b) => Date.parse(b.created_at || b.created_date) - Date.parse(a.created_at || a.created_date));
}
export function useRecentItems(items) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const nextExpiry = items.map(item => Date.parse(item.created_at || item.created_date || '') + WINDOW_MS + 1).filter(time => time > Date.now()).sort((a, b) => a - b)[0];
    const timer = nextExpiry ? setTimeout(tick, Math.min(nextExpiry - Date.now(), 2147483647)) : null;
    window.addEventListener('focus', tick);
    return () => { clearTimeout(timer); window.removeEventListener('focus', tick); };
  }, [items, now]);
  return recentlyCreated(items, Math.max(now, Date.now()));
}
export function RecentHeading({ title, to, label }) {
  return <div className="flex items-center justify-between gap-3 mb-3">
    <h2 className="text-section-title min-w-0 break-words">{title}</h2>
    {to ? <Link to={to} aria-label={label || ("See all " + title)} className="min-h-[44px] shrink-0 inline-flex items-center text-sm font-semibold text-primary px-2 rounded-lg focus-visible:ring-2 focus-visible:ring-primary">See all</Link> : null}
  </div>;
}
export default function RecentCarousel({label,children}) {
 return <div role="region" aria-label={label}><ul className="discovery-grid">{children}</ul></div>;
}
