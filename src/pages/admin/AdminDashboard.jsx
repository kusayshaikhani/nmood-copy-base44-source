import React, { useState, useEffect, useCallback } from 'react';
import KpiCard from '@/components/admin/KpiCard';
import SystemStatus from '@/components/admin/SystemStatus';
import ProductionOverview from '@/components/admin/analytics/ProductionOverview';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useAdminList } from '@/hooks/useAdminList';
import { Users, UserCheck, Radio, UserPlus, Crown, Calendar, Circle, Flag } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function AdminDashboard() {
  const { t } = useLocalization();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { data: reports } = useAdminList('SafetyReport', 20);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('adminConsole', { mode: 'stats' });
      setStats(res?.data);
    } catch {
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const recentReports = (Array.isArray(reports) ? reports : [])
    .filter((r) => r.status === 'submitted')
    .slice(0, 4);

  const kpis = [
    { id: 'total', label: 'Total Members', value: stats?.totalMembers ?? '—', icon: Users, color: 'primary' },
    { id: 'active', label: 'Active Members', value: stats?.activeMembers ?? '—', icon: UserCheck, color: 'success' },
    { id: 'online', label: 'Online Members', value: stats?.onlineMembers ?? '—', icon: Radio, color: 'info' },
    { id: 'new', label: 'New Registrations (24h)', value: stats?.newRegistrations ?? '—', icon: UserPlus, color: 'warning' },
    { id: 'premium', label: 'Premium Members', value: stats?.premiumMembers ?? '—', icon: Crown, color: 'primary' },
    { id: 'exp_today', label: 'Experiences Today', value: stats?.experiencesToday ?? '—', icon: Calendar, color: 'info' },
    { id: 'circ_today', label: 'Circles Today', value: stats?.circlesToday ?? '—', icon: Circle, color: 'success' },
    { id: 'reports', label: 'Pending Reports', value: stats?.pendingReports ?? '—', icon: Flag, color: 'destructive' },
  ];

  const growth = stats?.growth || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{t('admin.dashboard')}</h1>
          <p className="text-sm text-muted-foreground">{t('admin.platform_overview_and_system_health')}</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadStats} disabled={loading}>
          {loading ? 'Refreshing…' : 'Refresh'}
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.id} {...kpi} />
        ))}
      </div>

      <ProductionOverview />

      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3">{t('admin.new_members_last_7_days')}</h3>
        {growth.length ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={growth} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area type="monotone" dataKey="newMembers" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#growthFill)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-muted-foreground py-8 text-center">{t('admin.no_growth_data_yet')}</p>
        )}
      </Card>

      <SystemStatus items={stats?.systemHealth || []} />

      {recentReports.length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Flag className="w-4 h-4 text-destructive" /> {t('admin.pending_reports')}
          </h3>
          <div className="space-y-2">
            {recentReports.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <div>
                  <p className="text-sm font-medium">{r.target_name || r.target_type}</p>
                  <p className="text-xs text-muted-foreground">{r.reason || 'No reason given'}</p>
                </div>
                <span className="text-xs text-muted-foreground">{r.priority || 'medium'}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}