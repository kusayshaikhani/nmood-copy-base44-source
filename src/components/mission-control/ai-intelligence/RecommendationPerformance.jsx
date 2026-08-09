import React from 'react';
import { TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { MCSection } from '@/components/mission-control/ui';
import { sampleTrend } from '@/lib/ai-intelligence-metrics';
import { useLocalization } from '@/lib/i18n/useLocalization';

function Kpi({ label, value }) {
  const placeholder = value === null || value === undefined;
  return (
    <div className="rounded-lg bg-muted/40 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={placeholder ? 'text-sm text-muted-foreground/60 font-medium' : 'text-lg font-bold'}>{placeholder ? 'Awaiting telemetry' : value}</p>
    </div>
  );
}

export default function RecommendationPerformance({ perf }) {
  const { t } = useLocalization();
  const data = sampleTrend(82);
  return (
    <MCSection icon={TrendingUp} title={t('mission.recommendation_performance')} action={<span className="text-[10px] text-muted-foreground">{t('mission.sample_awaiting_telemetry')}</span>}>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        <Kpi label="Total" value={perf.total} />
        <Kpi label="Accepted" value={perf.accepted} />
        <Kpi label="Ignored" value={perf.ignored} />
        <Kpi label="Saved" value={perf.saved} />
        <Kpi label="Click-through Rate" value={perf.ctr} />
        <Kpi label="Acceptance Rate" value={perf.acceptanceRate} />
        <Kpi label="Avg Score" value={perf.avgScore} />
      </div>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" domain={[60, 100]} />
            <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
            <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Acceptance %" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </MCSection>
  );
}