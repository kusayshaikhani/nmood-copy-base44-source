import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, ShieldCheck, ShieldAlert, Clock } from 'lucide-react';
import { useFatExecution } from '@/lib/fat-execution-store.jsx';
import FatTestRow from '@/components/fat/FatTestRow';
import FatCertificationSheet from '@/components/fat/FatCertificationSheet';

function certBadgeClass(approval) {
  if (approval === 'approved') return 'bg-success/10 text-success';
  if (approval === 'rejected') return 'bg-destructive/10 text-destructive';
  return 'bg-muted text-muted-foreground';
}

export default function FatSuiteCard({ suite }) {
  const { state } = useFatExecution();
  const [open, setOpen] = useState(false);
  const [certOpen, setCertOpen] = useState(false);

  const results = suite.scenarios.map((sc) => state.results[sc.id]?.status || 'notTested');
  const passCount = results.filter((s) => ['pass', 'passWithNotes', 'approved'].includes(s)).length;
  const failCount = results.filter((s) => s === 'fail').length;
  const blockedCount = results.filter((s) => s === 'blocked').length;
  const testedCount = results.filter((s) => s !== 'notTested').length;
  const cert = state.certifications[suite.id] || { approval: 'pending', status: 'Not Certified' };
  const progress = Math.round((passCount / suite.scenarios.length) * 100);

  return (
    <Card className="overflow-hidden">
      <button
        className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-default"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex items-center gap-3 min-w-0">
          {open ? <ChevronDown className="w-4 h-4 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 flex-shrink-0" />}
          <div className="min-w-0">
            <p className="text-sm font-semibold">{suite.module}</p>
            <p className="text-xs text-muted-foreground truncate">
              {passCount}/{suite.scenarios.length} passed
              {failCount > 0 && ` · ${failCount} failed`}
              {blockedCount > 0 && ` · ${blockedCount} blocked`}
              {suite.signOffRequired ? ' · Mandatory' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-muted-foreground hidden sm:inline">{progress}%</span>
          <span className={'text-xs font-medium px-2 py-1 rounded-md ' + certBadgeClass(cert.approval)}>
            {cert.approval === 'approved' ? 'Certified' : cert.approval === 'rejected' ? 'Rejected' : 'Pending'}
          </span>
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: progress + '%' }} />
          </div>

          {suite.scenarios.map((sc) => (
            <FatTestRow key={sc.id} scenario={sc} suite={suite} />
          ))}

          <div className="flex items-center justify-between gap-2 pt-3 border-t border-border flex-wrap">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Founder Certification: <span className="font-medium text-foreground">{cert.status || 'Not Certified'}</span></span>
              {cert.date && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {cert.date}</span>}
            </div>
            <Button variant="outline" size="sm" onClick={() => setCertOpen(true)}>
              <ShieldCheck className="w-3.5 h-3.5" /> {cert.approval === 'pending' ? 'Certify Suite' : 'Edit Certification'}
            </Button>
          </div>
        </div>
      )}

      <FatCertificationSheet suiteId={suite.id} module={suite.module} open={certOpen} onOpenChange={setCertOpen} />
    </Card>
  );
}