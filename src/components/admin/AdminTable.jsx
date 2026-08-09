import React from 'react';
import { Card } from '@/components/ui/card';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function AdminTable({ columns, data }) {
  const { t } = useLocalization();
  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">{t('admin.no_data_available')}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/30">
              {columns.map((col) => (
                <th key={col.key} className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 whitespace-nowrap uppercase tracking-wide">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={row.id || i} className="border-b last:border-0 hover:bg-muted/20 transition-default">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-sm whitespace-nowrap">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}