import React, { useState } from 'react';
import { Play, Check, CheckCheck, XCircle, Pause, RotateCcw, ShieldCheck, ShieldX, Paperclip, ShieldAlert } from 'lucide-react';
import { useFatExecution, STATUS_META } from '@/lib/fat-execution-store.jsx';
import FatEvidenceSheet from '@/components/fat/FatEvidenceSheet';
import FatDefectSheet from '@/components/fat/FatDefectSheet';

function ActionBtn({ active, chip, onClick, title, children }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={'px-2 py-1 rounded-md text-[10px] font-medium transition-default ' + (active ? chip : 'bg-muted/40 text-muted-foreground hover:bg-muted')}
    >
      {children}
    </button>
  );
}

export default function FatTestRow({ scenario, suite }) {
  const { state, runTest, setStatus, retest, addDefect } = useFatExecution();
  const res = state.results[scenario.id] || { status: 'notTested' };
  const meta = STATUS_META[res.status] || STATUS_META.notTested;
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [defectOpen, setDefectOpen] = useState(false);
  const [activeDefectId, setActiveDefectId] = useState(null);

  const defects = state.defects.filter((d) => d.scenarioId === scenario.id);

  const handleFail = () => {
    setStatus(scenario.id, 'fail');
    if (defects.length === 0) {
      const d = {
        title: scenario.scenario,
        module: suite.module,
        suiteId: suite.id,
        scenarioId: scenario.id,
        severity: 'High',
        stepsToReproduce: '',
        expectedResult: scenario.expected,
        actualResult: '',
        status: 'Open',
        owner: '',
        resolution: '',
        retestStatus: 'Pending',
      };
      addDefect(d);
      setActiveDefectId(null); // sheet will operate on the just-created defect for this scenario
    }
    setDefectOpen(true);
  };

  const openNewDefect = () => {
    setActiveDefectId(null);
    setDefectOpen(true);
  };

  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-muted-foreground">{scenario.id}</span>
            <span className={'text-[10px] font-medium px-1.5 py-0.5 rounded ' + meta.chip}>{meta.label}</span>
            {res.runCount > 0 && <span className="text-[10px] text-muted-foreground">Run {res.runCount}×</span>}
          </div>
          <p className="text-sm font-medium mt-1">{scenario.scenario}</p>
          <p className="text-xs text-muted-foreground">Expected: {scenario.expected}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1 mt-2.5">
        <ActionBtn title="Run Test" active={false} chip="" onClick={() => runTest(scenario.id)}>
          <Play className="w-3 h-3 inline -mt-0.5" /> Run
        </ActionBtn>
        <ActionBtn title="Pass" active={res.status === 'pass'} chip={STATUS_META.pass.chip} onClick={() => setStatus(scenario.id, 'pass')}>
          <Check className="w-3 h-3 inline -mt-0.5" /> Pass
        </ActionBtn>
        <ActionBtn title="Pass with Notes" active={res.status === 'passWithNotes'} chip={STATUS_META.passWithNotes.chip} onClick={() => setStatus(scenario.id, 'passWithNotes')}>
          <CheckCheck className="w-3 h-3 inline -mt-0.5" /> Pass w/ Notes
        </ActionBtn>
        <ActionBtn title="Fail" active={res.status === 'fail'} chip={STATUS_META.fail.chip} onClick={handleFail}>
          <XCircle className="w-3 h-3 inline -mt-0.5" /> Fail
        </ActionBtn>
        <ActionBtn title="Blocked" active={res.status === 'blocked'} chip={STATUS_META.blocked.chip} onClick={() => setStatus(scenario.id, 'blocked')}>
          <Pause className="w-3 h-3 inline -mt-0.5" /> Blocked
        </ActionBtn>
        <ActionBtn title="Retest" active={false} chip="" onClick={() => retest(scenario.id)}>
          <RotateCcw className="w-3 h-3 inline -mt-0.5" /> Retest
        </ActionBtn>
        <ActionBtn title="Approve" active={res.status === 'approved'} chip={STATUS_META.approved.chip} onClick={() => setStatus(scenario.id, 'approved')}>
          <ShieldCheck className="w-3 h-3 inline -mt-0.5" /> Approve
        </ActionBtn>
        <ActionBtn title="Reject" active={res.status === 'rejected'} chip={STATUS_META.rejected.chip} onClick={() => setStatus(scenario.id, 'rejected')}>
          <ShieldX className="w-3 h-3 inline -mt-0.5" /> Reject
        </ActionBtn>
      </div>

      <div className="flex items-center gap-2 mt-2">
        <button type="button" onClick={() => setEvidenceOpen(true)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
          <Paperclip className="w-3.5 h-3.5" /> Evidence
          {res.evidence?.attachments?.length > 0 && <span className="text-[10px] bg-primary/10 text-primary px-1 rounded">{res.evidence.attachments.length}</span>}
        </button>
        {(res.status === 'fail' || res.status === 'blocked' || defects.length > 0) && (
          <button type="button" onClick={openNewDefect} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" /> {defects.length > 0 ? `Defects (${defects.length})` : 'Log Defect'}
          </button>
        )}
      </div>

      <FatEvidenceSheet scenarioId={scenario.id} open={evidenceOpen} onOpenChange={setEvidenceOpen} />
      <FatDefectSheet
        scenarioId={scenario.id}
        suiteId={suite.id}
        module={suite.module}
        scenarioText={scenario.scenario}
        expected={scenario.expected}
        defectId={activeDefectId}
        open={defectOpen}
        onOpenChange={setDefectOpen}
      />
    </div>
  );
}