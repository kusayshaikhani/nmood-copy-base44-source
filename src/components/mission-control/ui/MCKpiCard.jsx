import React from 'react';

const COLORS = {
  primary: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
  destructive: 'text-destructive',
  info: 'text-info',
};

/**
 * FM-004 — Standard KPI summary card. Supports a loading skeleton and an
 * optional trend, structured so live updates can be wired in later.
 */
export function MCKpiCard({ icon: Icon, label, value, sublabel, trend, trendUp, color = 'primary', loading }) {
  if (loading) {
    return (
      <div className="rounded-xl border bg-card/80 backdrop-blur p-4">
        <div className="h-3 w-24 shimmer rounded mb-3" />
        <div className="h-7 w-16 shimmer rounded" />
      </div>
    );
  }
  const c = COLORS[color] || COLORS.primary;
  return (
    <div className="rounded-xl border bg-card/80 backdrop-blur p-4 transition-default hover:shadow-md hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        {Icon && (
          <div className={'w-8 h-8 rounded-lg bg-muted/40 flex items-center justify-center ' + c}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <p className="text-2xl font-bold mt-2 tracking-tight">{value}</p>
      {(trend || sublabel) && (
        <p className={'text-xs mt-1 ' + (trend ? (trendUp ? 'text-success' : 'text-destructive') : 'text-muted-foreground')}>
          {trend ? `${trendUp ? '↑' : '↓'} ${trend}` : sublabel}
        </p>
      )}
    </div>
  );
}

export function MCKpiGrid({ children }) {
  return <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">{children}</div>;
}