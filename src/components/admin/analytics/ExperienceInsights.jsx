import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import KpiGrid from './KpiGrid';
import ChartCard from './ChartCard';
import { experienceInsightKpis, categoryData } from '@/lib/admin-data';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function ExperienceInsights() {
  const { t } = useLocalization();
  return (
    <div>
      <h2 className="text-sm font-semibold mb-3">{t('admin.experience_insights')}</h2>
      <div className="mb-4">
        <KpiGrid kpis={experienceInsightKpis} className="grid-cols-2 md:grid-cols-3 lg:grid-cols-6" />
      </div>
      <ChartCard title={t('admin.most_popular_categories')} subtitle="Experiences by category">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={categoryData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
            <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <YAxis type="category" dataKey="category" stroke="hsl(var(--muted-foreground))" fontSize={11} width={70} />
            <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
            <Bar dataKey="count" fill="hsl(var(--chart-4))" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}