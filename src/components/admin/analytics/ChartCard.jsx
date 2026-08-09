import React from 'react';
import { Card } from '@/components/ui/card';

export default function ChartCard({ title, subtitle, children, className }) {
  return (
    <Card className={'p-5 ' + (className || '')}>
      <div className="mb-4">
        <h3 className="text-sm font-semibold">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </Card>
  );
}