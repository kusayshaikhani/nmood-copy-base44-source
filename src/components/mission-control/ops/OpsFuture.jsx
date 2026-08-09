import React from 'react';
import { FlaskConical } from 'lucide-react';
import { MCSection } from '@/components/mission-control/ui';
import { useLocalization } from '@/lib/i18n/useLocalization';

const FUTURE = [
  { title: 'API Key Management', desc: 'Create, rotate, and revoke administrative API keys.' },
  { title: 'Webhooks', desc: 'Outbound webhook configuration and delivery logs.' },
  { title: 'Third-party Integrations', desc: 'Manage connected services and credentials.' },
  { title: 'Secrets Management', desc: 'Centralized secret storage with rotation policies.' },
  { title: 'Infrastructure Monitoring', desc: 'Live CPU, memory, and network telemetry.' },
  { title: 'Kubernetes / Containers', desc: 'Cluster health, pods, and deployments.' },
  { title: 'Cloud Services', desc: 'Cloud provider status and resource usage.' },
  { title: 'AI Infrastructure', desc: 'Model serving, GPU usage, and inference latency.' },
];

export default function OpsFuture() {
  const { t } = useLocalization();
  return (
    <MCSection icon={FlaskConical} title={t('mission.future_operations_modules')}>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {FUTURE.map((f) => (
          <div key={f.title} className="rounded-xl border bg-card/60 p-4">
            <span className="text-xs px-2 py-0.5 rounded-full bg-warning/15 text-warning font-medium">{t('mission.coming_soon')}</span>
            <h4 className="text-sm font-semibold mt-2">{f.title}</h4>
            <p className="text-xs text-muted-foreground mt-1">{f.desc}</p>
          </div>
        ))}
      </div>
    </MCSection>
  );
}