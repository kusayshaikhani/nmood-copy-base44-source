import React, { useMemo, useState } from 'react';
import {
  Server, RefreshCw, LayoutDashboard, Activity, Lock, ScrollText, Flag, Settings,
  Image, Rocket, Cog, DatabaseBackup, Gauge, ListChecks, FileText, HardDrive,
  Search, Download, FlaskConical,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOpsData } from '@/hooks/useOpsData';
import { computePlatformOverview, computeSystemHealth, computeSecurity, computeApiHealth } from '@/lib/ops-metrics';
import { MCModuleHeader, MCErrorState, MCLoadingState } from '@/components/mission-control/ui';
import OpsOverview from './OpsOverview';
import OpsSystemHealth from './OpsSystemHealth';
import OpsSecurity from './OpsSecurity';
import OpsAudit from './OpsAudit';
import OpsFeatureFlags from './OpsFeatureFlags';
import OpsSettings from './OpsSettings';
import OpsMediaLibrary from './OpsMediaLibrary';
import OpsDeployment from './OpsDeployment';
import OpsConfiguration from './OpsConfiguration';
import OpsBackup from './OpsBackup';
import OpsApiHealth from './OpsApiHealth';
import OpsJobs from './OpsJobs';
import OpsLogs from './OpsLogs';
import OpsStorage from './OpsStorage';
import OpsGlobalSearch from './OpsGlobalSearch';
import OpsExport from './OpsExport';
import OpsFuture from './OpsFuture';
import { useLocalization } from '@/lib/i18n/useLocalization';

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'system-health', label: 'System Health', icon: Activity },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'audit', label: 'Audit', icon: ScrollText },
  { id: 'feature-flags', label: 'Feature Flags', icon: Flag },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'media', label: 'Media', icon: Image },
  { id: 'deployment', label: 'Deployment', icon: Rocket },
  { id: 'configuration', label: 'Configuration', icon: Cog },
  { id: 'backup', label: 'Backup', icon: DatabaseBackup },
  { id: 'api-health', label: 'API Health', icon: Gauge },
  { id: 'jobs', label: 'Jobs', icon: ListChecks },
  { id: 'logs', label: 'Logs', icon: FileText },
  { id: 'storage', label: 'Storage', icon: HardDrive },
  { id: 'search', label: 'Search', icon: Search },
  { id: 'export', label: 'Export', icon: Download },
  { id: 'future', label: 'Future', icon: FlaskConical },
];

/** FM-011 — Platform Operations Center. Highest-privileged admin workspace. */
export default function PlatformOperationsCenter({ initialTab = 'overview' }) {
  const { t } = useLocalization();
  const { data, loading, error, refresh } = useOpsData();
  const [tab, setTab] = useState(initialTab);
  const metrics = useMemo(() => data ? {
    overview: computePlatformOverview(data),
    services: computeSystemHealth(data),
    security: computeSecurity(data),
    apiHealth: computeApiHealth(data),
  } : null, [data]);

  if (loading) return <div className="max-w-[1400px] mx-auto pb-10"><MCLoadingState rows={10} /></div>;
  if (error) return <MCErrorState title={t('mission.platform_operations_unavailable')} description="Could not load operational data." onRetry={refresh} />;
  if (!data || !metrics) return <MCErrorState title={t('mission.no_data')} description="No operational data available." />;

  return (
    <div className="max-w-[1400px] mx-auto pb-10">
      <MCModuleHeader icon={Server} title={t('mission.platform_operations')} description="Infrastructure, security, configuration, monitoring & deployments." breadcrumb={[{ label: 'Platform Operations' }]} />
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} className={cn('flex items-center gap-1.5 px-3 py-2 text-sm whitespace-nowrap border-b-2 -mb-px transition-default', tab === t.id ? 'border-primary text-primary font-medium' : 'border-transparent text-muted-foreground hover:text-foreground')}>
                <Icon className="w-4 h-4" /> {t.label}
              </button>
            );
          })}
        </div>
        <button onClick={refresh} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg hover:bg-muted/40" aria-label={t('mission.refresh_operations_data')}>
          <RefreshCw className="w-4 h-4" /> {t('admin.refresh')}
        </button>
      </div>
      <div className="mt-4">
        {tab === 'overview' && <OpsOverview overview={metrics.overview} />}
        {tab === 'system-health' && <OpsSystemHealth services={metrics.services} />}
        {tab === 'security' && <OpsSecurity security={metrics.security} />}
        {tab === 'audit' && <OpsAudit data={data} />}
        {tab === 'feature-flags' && <OpsFeatureFlags data={data} onToggle={refresh} />}
        {tab === 'settings' && <OpsSettings data={data} />}
        {tab === 'media' && <OpsMediaLibrary />}
        {tab === 'deployment' && <OpsDeployment />}
        {tab === 'configuration' && <OpsConfiguration data={data} />}
        {tab === 'backup' && <OpsBackup />}
        {tab === 'api-health' && <OpsApiHealth apiHealth={metrics.apiHealth} />}
        {tab === 'jobs' && <OpsJobs />}
        {tab === 'logs' && <OpsLogs data={data} />}
        {tab === 'storage' && <OpsStorage />}
        {tab === 'search' && <OpsGlobalSearch data={data} />}
        {tab === 'export' && <OpsExport data={data} />}
        {tab === 'future' && <OpsFuture />}
      </div>
    </div>
  );
}