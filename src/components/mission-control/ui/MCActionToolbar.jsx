import React from 'react';
import { Search } from 'lucide-react';

/**
 * FM-004 — Standard module action toolbar. Sticky while scrolling.
 * Compose with ToolbarSearch / ToolbarSelect / ToolbarButton slots.
 */
export default function MCActionToolbar({ children, className = '' }) {
  return (
    <div className={'sticky top-0 z-30 -mx-1 px-1 py-2 mb-3 bg-background/80 backdrop-blur border-b border-border ' + className}>
      <div className="flex flex-col sm:flex-row gap-2">{children}</div>
    </div>
  );
}

export function ToolbarSearch({ value, onChange, placeholder = 'Search…', className = '' }) {
  return (
    <div className={'relative flex-1 ' + className}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-10 pl-10 pr-4 text-sm rounded-lg bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
    </div>
  );
}

export function ToolbarSelect({ value, onChange, options, ariaLabel, className = '' }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={ariaLabel}
      className={'h-10 px-3 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ' + className}
    >
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export function ToolbarButton({ icon: Icon, label, onClick, active, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={'h-10 px-3 rounded-lg text-sm font-medium border inline-flex items-center justify-center gap-2 transition-default whitespace-nowrap ' +
        (active ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground hover:bg-muted/50') + ' ' + className}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {label}
    </button>
  );
}