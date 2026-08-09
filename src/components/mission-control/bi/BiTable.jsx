import React from 'react';

/** FM-010 — Lightweight ranked table for BI intelligence sections. */
export default function BiTable({ columns, rows, emptyLabel = 'No data yet' }) {
  if (!rows?.length) {
    return <p className="text-sm text-muted-foreground py-6 text-center">{emptyLabel}</p>;
  }
  return (
    <div className="overflow-x-auto max-h-72">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-card">
          <tr className="text-left text-xs text-muted-foreground border-b">
            {columns.map((c) => (
              <th key={c.key} className="py-2 px-2 font-medium">{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
              {columns.map((c) => (
                <td key={c.key} className="py-2 px-2">{c.render ? c.render(r) : (r[c.key] ?? '—')}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}