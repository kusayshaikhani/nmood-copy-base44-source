import React from 'react';
import { FileText, Lock } from 'lucide-react';
import { MCSection } from '@/components/mission-control/ui';
import { PROMPT_LIBRARY } from '@/lib/ai-intelligence-metrics';
import { useLocalization } from '@/lib/i18n/useLocalization';

const STATUS_BADGE = { active: 'bg-success/15 text-success', beta: 'bg-warning/15 text-warning', retired: 'bg-muted text-muted-foreground' };

export default function PromptManagement({ search }) {
  const { t } = useLocalization();
  const rows = PROMPT_LIBRARY.filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.usedBy.toLowerCase().includes(search.toLowerCase()));
  return (
    <MCSection icon={FileText} title={t('mission.prompt_library')} action={<span className="text-[10px] text-muted-foreground inline-flex items-center gap-1"><Lock className="w-3 h-3" /> {t('mission.readonly')}</span>}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-wide text-muted-foreground border-b border-border">
              <th className="py-2 pr-3 font-medium">{t('mission.prompt_name')}</th>
              <th className="py-2 pr-3 font-medium">{t('mission.version')}</th>
              <th className="py-2 pr-3 font-medium">{t('admin.status')}</th>
              <th className="py-2 pr-3 font-medium hidden sm:table-cell">{t('mission.last_updated')}</th>
              <th className="py-2 font-medium hidden sm:table-cell">{t('mission.used_by')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.name} className="border-b border-border last:border-0">
                <td className="py-2.5 pr-3 font-medium">{p.name}</td>
                <td className="py-2.5 pr-3 text-muted-foreground font-mono text-xs">{p.version}</td>
                <td className="py-2.5 pr-3"><span className={'text-[10px] px-2 py-0.5 rounded-full font-medium ' + (STATUS_BADGE[p.status] || STATUS_BADGE.retired)}>{p.status}</span></td>
                <td className="py-2.5 pr-3 text-muted-foreground hidden sm:table-cell">{p.lastUpdated}</td>
                <td className="py-2.5 text-muted-foreground hidden sm:table-cell">{p.usedBy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] text-muted-foreground/70 mt-2">{t('mission.sample_data_prompt_version_management')}</p>
    </MCSection>
  );
}