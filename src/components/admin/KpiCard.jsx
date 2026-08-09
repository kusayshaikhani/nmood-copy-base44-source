import React from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

const colorMap = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  info: 'bg-info/10 text-info',
  destructive: 'bg-destructive/10 text-destructive',
};

export default function KpiCard({ icon: Icon, label, value, trend, trendUp, color = 'primary' }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <div className={'w-9 h-9 rounded-lg flex items-center justify-center ' + (colorMap[color] || colorMap.primary)}>
          <Icon className="w-4 h-4" />
        </div>
        {trend && (
          <span className={'flex items-center gap-0.5 text-xs font-medium ' + (trendUp ? 'text-success' : 'text-destructive')}>
            {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend}
          </span>
        )}
      </div>
      <p className="text-xl font-bold tracking-tight">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </Card>
  );
}