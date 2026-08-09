import React from 'react';
import { Card } from '@/components/ui/card';
import { CheckCircle2, XCircle, AlertTriangle, Ban } from 'lucide-react';

export default function StoreReadinessSummary({ label, items, states }) {
  const count = (st) => items.filter((i) => (states[i.id] || i.default) === st).length;
  const completed = count('completed');
  const missing = count('missing');
  const needsFounder = count('needsFounder');
  const na = count('notApplicable');
  const actionable = items.length - na;
  const ready = actionable > 0 && completed === actionable && missing === 0;

  const stats = [
    { key: 'completed', label: 'Completed', value: completed, icon: CheckCircle2, color: 'text-success' },
    { key: 'missing', label: 'Missing', value: missing, icon: XCircle, color: 'text-destructive' },
    { key: 'needsFounder', label: 'Needs Founder', value: needsFounder, icon: AlertTriangle, color: 'text-warning' },
    { key: 'na', label: 'N/A', value: na, icon: Ban, color: 'text-muted-foreground' },
  ];

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold">{label}</h3>
        <span className={'text-xs font-semibold ' + (ready ? 'text-success' : 'text-muted-foreground')}>
          {ready ? 'READY' : `${completed}/${actionable} done`}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {stats.map((s) => (
          <div key={s.key} className="text-center">
            <s.icon className={'w-4 h-4 mx-auto mb-1 ' + s.color} />
            <p className={'text-lg font-bold ' + s.color}>{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}