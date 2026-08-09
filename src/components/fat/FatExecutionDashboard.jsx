import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClipboardCheck, Download, CheckCircle2, XCircle, Pause, Clock, ShieldCheck } from 'lucide-react';
import { useFatExecution } from '@/lib/fat-execution-store.jsx';

function MetricCard({ label, value, accent }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={'text-2xl font-bold mt-0.5 ' + (accent || '')}>{value}</p>
    </div>
  );
}

export default function FatExecutionDashboard({ onExport }) {
  const { summary } = useFatExecution();
  const certified = summary.certificationStatus === 'Certified';

  return (
    <div className="space-y-4">
      <Card className={'p-4 ' + (certified ? 'bg-success/5' : 'bg-warning/5')}>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <ShieldCheck className={'w-8 h-8 ' + (certified ? 'text-success' : 'text-warning')} />
            <div>
              <p className="text-sm font-semibold">{certified ? 'READY FOR STORE SUBMISSION' : 'CERTIFICATION IN PROGRESS'}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Current Certification Status: <span className="font-medium text-foreground">{summary.certificationStatus}</span>
              </p>
            </div>
          </div>
          {onExport && (
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download className="w-4 h-4" /> Export Results
            </Button>
          )}
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-medium">Overall Progress</span>
            <span className="text-muted-foreground">{summary.passedTotal}/{summary.total} tests · {summary.overallProgress}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: summary.overallProgress + '%' }} />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard label="Suites Completed" value={`${summary.suitesCompleted}/${summary.suitesTotal}`} accent="text-success" />
        <MetricCard label="Suites Remaining" value={summary.suitesRemaining} accent={summary.suitesRemaining > 0 ? 'text-warning' : ''} />
        <MetricCard label="Tests Passed" value={summary.passedTotal} accent="text-success" />
        <MetricCard label="Tests Failed" value={summary.fail} accent={summary.fail > 0 ? 'text-destructive' : ''} />
        <MetricCard label="Blocked Tests" value={summary.blocked} accent={summary.blocked > 0 ? 'text-warning' : ''} />
        <MetricCard label="Open Defects" value={summary.openDefects} accent={summary.openDefects > 0 ? 'text-warning' : ''} />
      </div>

      <div className="flex items-center gap-4 flex-wrap text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-success" /> {summary.pass} pass · {summary.passWithNotes} w/ notes</span>
        <span className="flex items-center gap-1"><XCircle className="w-3.5 h-3.5 text-destructive" /> {summary.fail} failed</span>
        <span className="flex items-center gap-1"><Pause className="w-3.5 h-3.5 text-warning" /> {summary.blocked} blocked</span>
        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {summary.notTested} not tested</span>
        <span className="flex items-center gap-1"><ClipboardCheck className="w-3.5 h-3.5 text-primary" /> {summary.mandatoryCertified}/{summary.mandatory} mandatory suites certified</span>
        <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-destructive" /> {summary.critDefects} critical · {summary.highDefects} high</span>
      </div>
    </div>
  );
}