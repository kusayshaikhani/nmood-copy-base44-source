import React from 'react';
import { Users, Activity, UserPlus, Calendar, Circle, Heart, BarChart3, Crown } from 'lucide-react';
import { Card } from '@/components/ui/card';

function Kpi({ icon: Icon, label, value, hint, accent }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${accent || 'bg-primary/10'}`}>
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      {hint && <p className="text-[11px] text-muted-foreground mt-0.5">{hint}</p>}
    </Card>
  );
}

export default function ProductKpiGrid({ totals }) {
  if (!totals) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      <Kpi icon={Users} label="Total Members" value={totals.totalMembers ?? '—'} accent="bg-primary/10" />
      <Kpi icon={Activity} label="Active (30d)" value={totals.activeMembers30d ?? '—'} hint="Distinct active users" accent="bg-success/10" />
      <Kpi icon={UserPlus} label="New Registrations" value={totals.newRegistrations ?? '—'} hint="Completed sign-ups" />
      <Kpi icon={Calendar} label="Experiences Created" value={totals.experiencesCreated ?? '—'} />
      <Kpi icon={Circle} label="Circles Created" value={totals.circlesCreated ?? '—'} />
      <Kpi icon={Heart} label="Connections Made" value={totals.connectionsMade ?? '—'} hint="Active pal connections" />
      <Kpi icon={BarChart3} label="Avg Profile Completion" value={`${totals.avgProfileCompletion ?? 0}%`} accent="bg-accent/20" />
      <Kpi icon={Crown} label="Membership Conversion" value={`${totals.membershipConversion ?? 0}%`} hint="Premium / total" accent="bg-warning/10" />
    </div>
  );
}