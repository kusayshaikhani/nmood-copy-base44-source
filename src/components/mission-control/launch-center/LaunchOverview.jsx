import React from 'react';
import { Rocket, Activity, ShieldCheck, AlertTriangle, TrendingUp, Users, MessageSquare, Calendar, UsersRound, Flag, Bell } from 'lucide-react';
import { MCSection, MCKpiCard, MCKpiGrid } from '@/components/mission-control/ui';
import { useLocalization } from '@/lib/i18n/useLocalization';

const GO_TONE = { green: 'text-success', yellow: 'text-warning', red: 'text-destructive' };
const GO_LABEL = { green: 'Ready', yellow: 'Needs Review', red: 'Do Not Launch' };
const GO_BG = { green: 'bg-success/15', yellow: 'bg-warning/15', red: 'bg-destructive/15' };
const STATUS_DOT = { operational: 'bg-success', degraded: 'bg-warning', partial_outage: 'bg-warning', major_outage: 'bg-destructive', maintenance: 'bg-info' };

/** RRPH-002 — Founder Launch Center overview: readiness score, go/no-go, live platform status. */
export default function LaunchOverview({ data, onUpdated }) {
  const { t } = useLocalization();
  const d = data || {};
  const readiness = d.readiness || { domains: [], overall: 0, status: 'yellow', reasons: [] };
  const live = d.live || {};
  const status = readiness.status;

  const liveKpis = [
    { icon: Users, label: 'Live Registrations', value: live.live?.registrations ?? 0, sublabel: `+${live.live?.registrationsToday ?? 0} today`, color: 'primary' },
    { icon: TrendingUp, label: 'Premium Upgrades', value: live.live?.premiumUpgrades ?? 0, color: 'info' },
    { icon: MessageSquare, label: 'Live Messages', value: live.live?.messages ?? 0, color: 'info' },
    { icon: Calendar, label: 'Live Experiences', value: live.live?.experiences ?? 0, color: 'primary' },
    { icon: UsersRound, label: 'Live Circles', value: live.live?.circles ?? 0, color: 'primary' },
    { icon: Flag, label: 'Open Reports', value: live.live?.reports ?? 0, color: 'warning' },
    { icon: AlertTriangle, label: 'Security Alerts', value: live.alerts?.security ?? 0, color: live.alerts?.security ? 'destructive' : 'success' },
    { icon: Bell, label: 'System Alerts', value: live.alerts?.system ?? 0, color: live.alerts?.system ? 'warning' : 'success' },
  ];

  return (
    <div className="space-y-4">
      <MCKpiGrid>{liveKpis.map((k) => <MCKpiCard key={k.label} {...k} />)}</MCKpiGrid>

      {/* Go / No-Go (Section 11) */}
      <MCSection icon={Rocket} title={t('mission.go_nogo_decision_section_11')}>
        <div className={`rounded-xl border p-4 flex items-center gap-4 ${GO_BG[status]}`}>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${GO_BG[status]} ${GO_TONE[status]} border-2 ${status === 'green' ? 'border-success' : status === 'yellow' ? 'border-warning' : 'border-destructive'}`}>
            <span className="text-xl font-bold">{status === 'green' ? '✓' : status === 'yellow' ? '!' : '✕'}</span>
          </div>
          <div className="flex-1">
            <p className={`text-lg font-bold ${GO_TONE[status]}`}>{GO_LABEL[status]}</p>
            <p className="text-sm text-muted-foreground">Overall readiness {readiness.overall}/100 · v{live.currentVersion} · {live.environment}</p>
          </div>
        </div>
        {readiness.reasons?.length > 0 && (
          <ul className="mt-3 space-y-1">
            {readiness.reasons.map((r, i) => (
              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2"><span className={GO_TONE[status]}>•</span>{r}</li>
            ))}
          </ul>
        )}
      </MCSection>

      {/* Production Readiness Score (Section 8) */}
      <MCSection icon={ShieldCheck} title={t('mission.production_readiness_score_section_8')}>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {readiness.domains?.map((dom) => (
            <div key={dom.name} className="rounded-lg border bg-card/60 px-3 py-2.5">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium">{dom.name}</p>
                <span className={`text-lg font-bold ${dom.score >= 95 ? 'text-success' : dom.score >= 80 ? 'text-warning' : 'text-destructive'}`}>{dom.score}</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className={`h-full ${dom.score >= 95 ? 'bg-success' : dom.score >= 80 ? 'bg-warning' : 'bg-destructive'}`} style={{ width: `${dom.score}%` }} />
              </div>
            </div>
          ))}
          <div className="rounded-lg border-2 border-primary/30 bg-primary/5 px-3 py-2.5 flex items-center justify-between">
            <p className="text-sm font-bold">{t('mission.overall')}</p>
            <p className="text-2xl font-bold text-primary">{readiness.overall}/100</p>
          </div>
        </div>
      </MCSection>

      {/* Platform Status (Section 9) */}
      <MCSection icon={Activity} title={t('mission.platform_status_section_9')}>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {(live.platformStatus || []).map((p) => (
            <div key={p.name} className="rounded-lg border bg-card/60 px-3 py-2 flex items-center justify-between">
              <p className="text-sm font-medium">{p.name}</p>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground capitalize">
                <span className={`w-2 h-2 rounded-full ${STATUS_DOT[p.status] || 'bg-muted-foreground'}`} />
                {p.status.replace('_', ' ')}
              </span>
            </div>
          ))}
        </div>
      </MCSection>
    </div>
  );
}