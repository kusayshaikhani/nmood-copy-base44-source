import React from 'react';
import KpiCard from '@/components/admin/KpiCard';

export default function KpiGrid({ kpis, className = 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6' }) {
  return (
    <div className={`grid ${className} gap-3`}>
      {kpis.map(kpi => <KpiCard key={kpi.id} {...kpi} />)}
    </div>
  );
}