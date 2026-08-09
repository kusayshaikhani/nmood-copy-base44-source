import React from 'react';

/**
 * FM-004 — Standard module page shell. Enforces the canonical section order:
 * Header → KPI Summary → Action Toolbar → Main Workspace → Activity Timeline.
 * Future modules compose this once and automatically follow the design standard.
 */
export default function MCPageShell({ header, kpis, toolbar, timeline, children, maxWidth = 'max-w-[1400px]' }) {
  return (
    <div className={maxWidth + ' mx-auto pb-10'}>
      {header}
      {kpis}
      {toolbar}
      {children}
      {timeline}
    </div>
  );
}