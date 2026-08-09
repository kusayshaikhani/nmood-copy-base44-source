import React from 'react';

/**
 * FM-004 — Module activity timeline. Newest first. Items:
 * { id, icon, title, subtitle, time }
 */
export default function MCActivityTimeline({ title = 'Recent Activity', items = [], loading = false, emptyLabel = 'No recent activity.' }) {
  return (
    <div className="rounded-xl border bg-card/80 backdrop-blur p-4 mt-5">
      <h3 className="text-sm font-semibold mb-3">{title}</h3>
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-4 shimmer rounded w-3/4" />)}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">{emptyLabel}</p>
      ) : (
        <ol className="space-y-0">
          {items.map((it, idx) => {
            const Icon = it.icon;
            const last = idx === items.length - 1;
            return (
              <li key={it.id || idx} className="flex gap-3">
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className="w-7 h-7 rounded-full bg-primary/15 text-primary flex items-center justify-center">
                    {Icon ? <Icon className="w-3.5 h-3.5" /> : <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                  </div>
                  {!last && <div className="w-px flex-1 bg-border my-1" />}
                </div>
                <div className="min-w-0 pb-3">
                  <p className="text-sm">{it.title}</p>
                  {it.subtitle && <p className="text-xs text-muted-foreground truncate">{it.subtitle}</p>}
                  {it.time && <p className="text-[10px] text-muted-foreground/70 mt-0.5">{it.time}</p>}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}