import React from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import KpiGrid from './KpiGrid';
import ChartCard from './ChartCard';
import { memberInsightKpis, mostActiveCities, mostActiveAgeGroups, newVsReturningData } from '@/lib/admin-data';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function MemberInsights() {
  const { t } = useLocalization();
  return (
    <div>
      <h2 className="text-sm font-semibold mb-3">{t('admin.member_insights')}</h2>
      <div className="mb-4">
        <KpiGrid kpis={memberInsightKpis} className="grid-cols-2 md:grid-cols-4" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard title={t('admin.most_active_cities')} subtitle="Top cities by members">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={mostActiveCities} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis type="category" dataKey="city" stroke="hsl(var(--muted-foreground))" fontSize={11} width={60} />
              <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
              <Bar dataKey="members" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title={t('admin.most_active_age_groups')} subtitle="Members by age range">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={mostActiveAgeGroups}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="group" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
              <Bar dataKey="members" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title={t('admin.new_vs_returning')} subtitle="Member composition">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={newVsReturningData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2}>
                {newVsReturningData.map((e, i) => <Cell key={i} fill={e.fill} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {newVsReturningData.map(t => (
              <div key={t.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: t.fill }} />
                <span className="text-xs text-muted-foreground">{t.name}: {t.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}