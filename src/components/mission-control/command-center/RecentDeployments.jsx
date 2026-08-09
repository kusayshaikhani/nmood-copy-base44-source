import React from 'react';
import { Rocket } from 'lucide-react';
import CommandSection from './CommandSection';
import { formatRelative } from '@/lib/command-center-metrics';
import { useLocalization } from '@/lib/i18n/useLocalization';

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}

const STATUS_DOT = { Healthy: 'bg-success', Passing: 'bg-success' };

export default function RecentDeployments({ deps }) {
  const { t } = useLocalization();
  return (
    <CommandSection icon={Rocket} title={t('mission.recent_deployments')}>
      <Row label="Current Version" value={deps.version} />
      <Row label="Deployment Date" value={formatRelative(deps.deployedAt)} />
      <Row label="Deployment Status" value={(
        <span className="inline-flex items-center gap-1.5">
          <span className={'w-2 h-2 rounded-full ' + (STATUS_DOT[deps.status] || 'bg-muted-foreground/40')} />
          {deps.status}
        </span>
      )} />
      <Row label="Environment" value={deps.environment} />
      <Row label="Build Health" value={(
        <span className="inline-flex items-center gap-1.5">
          <span className={'w-2 h-2 rounded-full ' + (STATUS_DOT[deps.buildHealth] || 'bg-muted-foreground/40')} />
          {deps.buildHealth}
        </span>
      )} />
      <p className="text-[10px] text-muted-foreground/70 mt-2">{t('mission.cicd_integration_coming_soon')}</p>
    </CommandSection>
  );
}