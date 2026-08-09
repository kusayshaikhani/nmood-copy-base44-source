import React from 'react';
import { RefreshCw, Activity, UserPlus, Crown, Calendar, UsersRound, Link2, Flag } from 'lucide-react';
import { greeting } from '@/lib/command-center-metrics';
import { useLocalization } from '@/lib/i18n/useLocalization';

const BRIEF_ICONS = {
  newMembers: UserPlus, premiumUpgrades: Crown, newExperiences: Calendar,
  newCircles: UsersRound, newConnections: Link2, reportsSubmitted: Flag,
};

function BriefChip({ icon: Icon, label, value, soon }) {
  return (
    <div className="rounded-xl bg-white/10 backdrop-blur px-3 py-2 border border-white/10">
      <p className="text-[10px] uppercase tracking-wide text-white/60 flex items-center gap-1">
        <Icon className="w-3 h-3" /> {label}
      </p>
      {soon ? (
        <span className="text-[10px] font-semibold text-white/50 mt-0.5 inline-block">Soon</span>
      ) : (
        <p className="text-lg font-bold leading-tight mt-0.5">{value}</p>
      )}
    </div>
  );
}

export default function MissionHero({ adminName, score, statusLabel, statusColor, loading, onRefresh, brief, deps }) {
  const { t } = useLocalization();
  const now = new Date();
  const dateStr = now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  const firstName = adminName ? adminName.split(' ')[0] : '';

  return (
    <div className="relative overflow-hidden rounded-card shadow-elevated bg-nmood-gradient text-white p-6 sm:p-8 animate-fade-in-up">
      <div className="absolute -top-16 -end-16 w-64 h-64 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />
      <div className="absolute -bottom-24 -start-10 w-72 h-72 rounded-full bg-white/5 blur-3xl" aria-hidden="true" />

      <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
        <div className="min-w-0">
          <p className="text-white/70 text-sm font-medium">{dateStr}</p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mt-1 text-balance">
            {greeting()}{firstName ? `, ${firstName}` : ''}.
          </h1>
          <p className="text-white/80 mt-2 max-w-lg text-body">{t('mission.hero_subtitle')}</p>
          <div className="flex flex-wrap items-center gap-2.5 mt-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
              </span>
              {t('mission.live')}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
              <Activity className="w-3.5 h-3.5" />
              {loading ? '—' : statusLabel}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
              <span className={loading ? 'text-white/60' : statusColor}>{loading ? '—' : score}</span>
              <span className="text-white/60">/ 100</span>
            </span>
          </div>
        </div>

        <button
          onClick={onRefresh}
          className="inline-flex items-center gap-2 rounded-button bg-white/15 hover:bg-white/25 px-4 py-2.5 text-sm font-semibold transition-default active:scale-95 self-start lg:self-end"
        >
          <RefreshCw className={'w-4 h-4 ' + (loading ? 'animate-spin' : '')} />
          {t('admin.refresh')}
        </button>
      </div>

      {brief && (
        <div className="relative mt-6">
          <p className="text-[11px] uppercase tracking-wide text-white/60 mb-2 font-semibold">{t('mission.since_last_login')}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            <BriefChip icon={BRIEF_ICONS.newMembers} label={t('mission.brief_new_members') || 'New Members'} value={brief.newMembers} />
            <BriefChip icon={BRIEF_ICONS.premiumUpgrades} label={t('mission.brief_premium_upgrades') || 'Premium'} value={brief.premiumUpgrades} />
            <BriefChip icon={BRIEF_ICONS.newExperiences} label={t('mission.brief_new_experiences') || 'Experiences'} value={brief.newExperiences} />
            <BriefChip icon={BRIEF_ICONS.newCircles} label={t('mission.brief_new_circles') || 'Circles'} value={brief.newCircles} />
            <BriefChip icon={BRIEF_ICONS.newConnections} label={t('mission.brief_new_connections') || 'Connections'} value={brief.newConnections} />
            <BriefChip icon={BRIEF_ICONS.reportsSubmitted} label={t('mission.brief_reports_submitted') || 'Reports'} value={brief.reportsSubmitted} />
          </div>
        </div>
      )}

      {deps && (
        <div className="relative mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-white/60">
          <span>{t('mission.system_version')} {deps.version}</span>
          <span className="hidden sm:inline">·</span>
          <span className="capitalize">{deps.environment}</span>
          <span className="hidden sm:inline">·</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-success" /> {deps.status}
          </span>
        </div>
      )}
    </div>
  );
}