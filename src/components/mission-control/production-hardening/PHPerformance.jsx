import React from 'react';
import { Gauge, TrendingUp, Layers } from 'lucide-react';
import { MCSection } from '@/components/mission-control/ui';
import { useLocalization } from '@/lib/i18n/useLocalization';

const STATUS_COLOR = { optimized: 'text-success', enabled: 'text-info', prepared: 'text-warning', planned: 'text-muted-foreground' };
const BENCH_BADGE = { pass: 'bg-success/15 text-success', warning: 'bg-warning/15 text-warning', fail: 'bg-destructive/15 text-destructive' };

/** RRPH-001 Sections 2, 3 & 14 — Performance, scalability & performance validation. */
export default function PHPerformance({ data }) {
  const { t } = useLocalization();
  const d = data || {};
  const perf = d.architecture?.performanceOptimizations || [];
  const scale = d.architecture?.scalabilityReadiness || [];
  const benchmarks = d.benchmarks || [];
  return (
    <div className="space-y-4">
      <MCSection icon={Gauge} title={t('mission.performance_optimization_section_2')}>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {perf.map((p) => (
            <div key={p.name} className="rounded-lg border bg-card/60 px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{p.name}</p>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">{p.status}</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">{p.detail}</p>
            </div>
          ))}
        </div>
      </MCSection>

      <MCSection icon={Layers} title={t('mission.scalability_readiness_section_3')}>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {scale.map((s) => (
            <div key={s.name} className="rounded-lg border bg-card/60 px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{s.name}</p>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full bg-muted capitalize ${STATUS_COLOR[s.status] || 'text-muted-foreground'}`}>{s.status}</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">{s.detail}</p>
            </div>
          ))}
        </div>
      </MCSection>

      <MCSection icon={TrendingUp} title={t('mission.performance_validation_section_14')}>
        <p className="text-xs text-muted-foreground mb-3">{t('mission.load_stress_spike_capacity_and')}</p>
        <div className="overflow-auto rounded-lg border">
          <table className="w-full text-xs">
            <thead className="bg-muted/40"><tr className="text-left">
              <th className="px-3 py-2 font-medium">{t('mission.type')}</th><th className="px-3 py-2 font-medium">{t('mission.target')}</th>
              <th className="px-3 py-2 font-medium">{t('admin.result')}</th><th className="px-3 py-2 font-medium">{t('mission.rps')}</th>
              <th className="px-3 py-2 font-medium">{t('mission.avg_ms')}</th><th className="px-3 py-2 font-medium">P95</th>
              <th className="px-3 py-2 font-medium">P99</th><th className="px-3 py-2 font-medium">{t('mission.error')}</th>
              <th className="px-3 py-2 font-medium">{t('mission.concurrent')}</th><th className="px-3 py-2 font-medium">{t('mission.notes')}</th>
            </tr></thead>
            <tbody>
              {benchmarks.map((b) => (
                <tr key={b.id} className="border-t hover:bg-muted/20">
                  <td className="px-3 py-2 font-medium capitalize">{b.benchmark_type}</td>
                  <td className="px-3 py-2 font-mono">{b.target}</td>
                  <td className="px-3 py-2"><span className={`px-1.5 py-0.5 rounded-full ${BENCH_BADGE[b.result]}`}>{b.result}</span></td>
                  <td className="px-3 py-2">{b.requests_per_second}</td>
                  <td className="px-3 py-2">{b.avg_latency_ms}</td>
                  <td className="px-3 py-2">{b.p95_latency_ms}</td>
                  <td className="px-3 py-2">{b.p99_latency_ms}</td>
                  <td className="px-3 py-2">{b.error_rate}</td>
                  <td className="px-3 py-2">{b.concurrent_users}</td>
                  <td className="px-3 py-2 text-muted-foreground">{b.notes}</td>
                </tr>
              ))}
              {!benchmarks.length && <tr><td colSpan={10} className="px-3 py-6 text-center text-muted-foreground">{t('mission.no_benchmarks_yet_click_seed')}</td></tr>}
            </tbody>
          </table>
        </div>
      </MCSection>
    </div>
  );
}