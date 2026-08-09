import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, ShieldAlert, Trash2 } from 'lucide-react';
import { useFatExecution, DEFECT_SEVERITIES } from '@/lib/fat-execution-store.jsx';
import FatDefectSheet from '@/components/fat/FatDefectSheet';

function severityColor(sev) {
  if (sev === 'Critical') return 'bg-destructive/10 text-destructive';
  if (sev === 'High') return 'bg-warning/10 text-warning';
  if (sev === 'Medium') return 'bg-primary/10 text-primary';
  return 'bg-muted text-muted-foreground';
}
function statusColor(status) {
  if (status === 'Closed') return 'bg-success/10 text-success';
  if (status === 'Fixed') return 'bg-primary/10 text-primary';
  if (status === "Won't Fix") return 'bg-muted text-muted-foreground';
  return 'bg-warning/10 text-warning';
}

export default function FatDefectsList() {
  const { state, removeDefect } = useFatExecution();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editOpen, setEditOpen] = useState(false);

  const defects = state.defects;

  const openDefect = (id) => { setEditId(id); setEditOpen(true); };

  return (
    <Card className="overflow-hidden">
      <button className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-default" onClick={() => setOpen((o) => !o)}>
        <div className="flex items-center gap-3">
          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <div>
            <p className="text-sm font-semibold flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-primary" /> Defect Management</p>
            <p className="text-xs text-muted-foreground">{defects.length} defect(s) · {defects.filter((d) => d.status !== 'Closed').length} open</p>
          </div>
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-2">
          {defects.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No defects logged. Failed tests will create one automatically.</p>
          ) : (
            defects.map((d) => (
              <div key={d.id} className="rounded-lg border border-border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[10px] text-muted-foreground">{d.id}</span>
                      <span className={'text-[10px] font-medium px-1.5 py-0.5 rounded ' + severityColor(d.severity)}>{d.severity}</span>
                      <span className={'text-[10px] font-medium px-1.5 py-0.5 rounded ' + statusColor(d.status)}>{d.status}</span>
                      <span className="text-[10px] text-muted-foreground">{d.module}</span>
                    </div>
                    <p className="text-sm font-medium mt-1 truncate">{d.title}</p>
                    {d.actualResult && <p className="text-xs text-destructive mt-0.5 line-clamp-2">Actual: {d.actualResult}</p>}
                    {d.owner && <p className="text-[10px] text-muted-foreground mt-0.5">Owner: {d.owner} · Retest: {d.retestStatus}</p>}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button size="sm" variant="outline" onClick={() => openDefect(d.id)}>Edit</Button>
                    <Button size="sm" variant="ghost" onClick={() => removeDefect(d.id)} className="text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <FatDefectSheet
        scenarioId={state.defects.find((d) => d.id === editId)?.scenarioId || ''}
        suiteId={state.defects.find((d) => d.id === editId)?.suiteId || ''}
        module={state.defects.find((d) => d.id === editId)?.module || ''}
        scenarioText={state.defects.find((d) => d.id === editId)?.title || ''}
        expected={state.defects.find((d) => d.id === editId)?.expectedResult || ''}
        defectId={editId}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </Card>
  );
}