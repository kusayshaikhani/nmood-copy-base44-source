import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert, BadgeCheck, Flag, Ban, Gavel, ChevronRight, Target,
} from 'lucide-react';
import PremiumGlassCard from './PremiumGlassCard';
import { useLocalization } from '@/lib/i18n/useLocalization';

const TONE = {
  destructive: { bg: 'bg-destructive/12', text: 'text-destructive', ring: 'ring-destructive/20' },
  warning: { bg: 'bg-warning/12', text: 'text-warning', ring: 'ring-warning/20' },
  primary: { bg: 'bg-primary/12', text: 'text-primary', ring: 'ring-primary/20' },
  info: { bg: 'bg-info/12', text: 'text-info', ring: 'ring-info/20' },
};

function ModCard({ icon: Icon, label, value, tone, soon, to }) {
  const { t } = useLocalization();
  const c = TONE[tone] || TONE.primary;
  return (
    <div className={`rounded-xl border border-border/50 bg-card/60 p-4 ring-1 ${c.ring} flex flex-col`}>
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.bg} ${c.text}`}>
          <Icon className="w-5 h-5" />
        </div>
        {soon ? (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{t('mission.moderation_soon')}</span>
        ) : (
          <p className={`text-2xl font-bold ${c.text}`}>{value}</p>
        )}
      </div>
      <p className="text-sm font-semibold mt-3">{label}</p>
      <Link to={to} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:gap-1.5 transition-all">
        {t('mission.moderation_review')} <ChevronRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}

export default function ModerationCenter({ trust, focus, loading }) {
  const { t } = useLocalization();
  const val = (v) => (v === null || v === undefined ? 0 : v);

  return (
    <PremiumGlassCard
      icon={ShieldAlert}
      title={t('mission.moderation_center')}
      action={<Link to="/mission-control/trust-safety" className="text-xs text-primary hover:underline">{t('mission.open')}</Link>}
    >
      {focus && focus.length > 0 && (
        <div className="mb-4 rounded-xl border border-warning/20 bg-warning/8 p-3">
          <p className="text-[10px] uppercase tracking-wide text-warning font-semibold flex items-center gap-1.5 mb-2">
            <Target className="w-3 h-3" /> {t('mission.todays_focus')}
          </p>
          <ul className="space-y-1.5">
            {focus.slice(0, 3).map((it, i) => (
              <li key={i} className="text-xs text-foreground/90 flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${it.severity === 'high' ? 'bg-destructive' : 'bg-warning'}`} />
                {it.label}
              </li>
            ))}
          </ul>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-28 shimmer rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <ModCard icon={Flag} label={t('mission.moderation_pending_reports')} value={val(trust?.openReports)} tone="destructive" to="/mission-control/trust-safety" />
          <ModCard icon={BadgeCheck} label={t('mission.moderation_verification')} value={0} tone="info" soon to="/mission-control/trust-safety" />
          <ModCard icon={ShieldAlert} label={t('mission.moderation_flagged')} value={val(trust?.aiFlagged)} tone="warning" to="/mission-control/trust-safety" />
          <ModCard icon={Ban} label={t('mission.moderation_blocked')} value={val(trust?.activeBans)} tone="destructive" to="/mission-control/trust-safety" />
          <ModCard icon={Gavel} label={t('mission.moderation_appeals')} value={val(trust?.pendingAppeals)} tone="warning" to="/mission-control/trust-safety" />
        </div>
      )}
    </PremiumGlassCard>
  );
}