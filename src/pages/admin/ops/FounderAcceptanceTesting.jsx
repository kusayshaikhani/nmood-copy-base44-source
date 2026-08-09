import React from 'react';
import { ClipboardCheck } from 'lucide-react';
import { FAT_SUITES } from '@/lib/fat-suites';
import { FatExecutionProvider, useFatExecution } from '@/lib/fat-execution-store.jsx';
import FatExecutionDashboard from '@/components/fat/FatExecutionDashboard';
import FatDefectsList from '@/components/fat/FatDefectsList';
import FatSuiteCard from '@/components/fat/FatSuiteCard';
import { useLocalization } from '@/lib/i18n/useLocalization';

function ExecutionCenter() {
  const { t } = useLocalization();
  const { state, summary } = useFatExecution();

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify({ suites: FAT_SUITES, ...state, summary }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nmood-fat-execution-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2"><ClipboardCheck className="w-5 h-5 text-primary" /> {t('mission.founder_acceptance_execution_center')}</h1>
        <p className="text-sm text-muted-foreground">{t('mission.release_10_execution_tracking_and')}</p>
      </div>

      <FatExecutionDashboard onExport={exportJSON} />
      <FatDefectsList />

      <div className="space-y-3">
        {FAT_SUITES.map((suite) => (
          <FatSuiteCard key={suite.id} suite={suite} />
        ))}
      </div>
    </div>
  );
}

export default function FounderAcceptanceTesting() {
  const { t } = useLocalization();
  return (
    <FatExecutionProvider>
      <ExecutionCenter />
    </FatExecutionProvider>
  );
}