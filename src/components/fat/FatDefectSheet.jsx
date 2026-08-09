import React, { useMemo, useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { ShieldAlert, Trash2 } from 'lucide-react';
import {
  useFatExecution, DEFECT_SEVERITIES, DEFECT_STATUSES, RETEST_STATUSES,
} from '@/lib/fat-execution-store.jsx';

const FIELD_CLS = 'h-9 text-sm';
const LABEL_CLS = 'text-xs font-semibold mb-1 block';

export default function FatDefectSheet({ scenarioId, suiteId, module, scenarioText, expected, defectId, open, onOpenChange }) {
  const { state, addDefect, updateDefect, removeDefect } = useFatExecution();
  const existing = useMemo(
    () => state.defects.find((d) => d.id === defectId) || null,
    [state.defects, defectId]
  );
  // Linked defects for this scenario (shown when opening via Fail with auto-create).
  const linked = useMemo(
    () => state.defects.filter((d) => d.scenarioId === scenarioId),
    [state.defects, scenarioId]
  );

  // The defect being edited: existing by id, else the first linked (auto-created on Fail), else a fresh draft.
  const active = existing || linked[0] || null;
  const isNew = !active;
  const [draft, setDraft] = useState(null);

  useEffect(() => {
    if (open) {
      if (active) {
        setDraft({ ...active });
      } else {
        setDraft({
          title: scenarioText || '', module: module || '', suiteId, scenarioId,
          severity: 'High', stepsToReproduce: '', expectedResult: expected || '', actualResult: '',
          status: 'Open', owner: '', resolution: '', retestStatus: 'Pending',
        });
      }
    }
  }, [open, active, scenarioText, module, suiteId, scenarioId, expected]);

  if (!open || !draft) return null;

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));

  const handleSave = () => {
    if (active) updateDefect(active.id, draft);
    else addDefect(draft);
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (active) removeDefect(active.id);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2"><ShieldAlert className="w-4 h-4" /> Structured Defect</SheetTitle>
          <SheetDescription>{isNew ? 'Log a new defect for this test.' : `Defect ${active.id}`}</SheetDescription>
        </SheetHeader>

        <div className="space-y-3 mt-4">
          <div>
            <Label className={LABEL_CLS}>Title</Label>
            <Input value={draft.title} onChange={(e) => set({ title: e.target.value })} className={FIELD_CLS} placeholder="Defect title" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className={LABEL_CLS}>Module</Label>
              <Input value={draft.module} onChange={(e) => set({ module: e.target.value })} className={FIELD_CLS} />
            </div>
            <div>
              <Label className={LABEL_CLS}>Severity</Label>
              <Select value={draft.severity} onValueChange={(v) => set({ severity: v })}>
                <SelectTrigger className={FIELD_CLS}><SelectValue /></SelectTrigger>
                <SelectContent>{DEFECT_SEVERITIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className={LABEL_CLS}>Steps to Reproduce</Label>
            <Textarea rows={3} value={draft.stepsToReproduce} onChange={(e) => set({ stepsToReproduce: e.target.value })} placeholder="1. … 2. … 3. …" />
          </div>
          <div className="grid grid-cols-1 gap-3">
            <div>
              <Label className={LABEL_CLS}>Expected Result</Label>
              <Textarea rows={2} value={draft.expectedResult} onChange={(e) => set({ expectedResult: e.target.value })} />
            </div>
            <div>
              <Label className={LABEL_CLS}>Actual Result</Label>
              <Textarea rows={2} value={draft.actualResult} onChange={(e) => set({ actualResult: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className={LABEL_CLS}>Status</Label>
              <Select value={draft.status} onValueChange={(v) => set({ status: v })}>
                <SelectTrigger className={FIELD_CLS}><SelectValue /></SelectTrigger>
                <SelectContent>{DEFECT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className={LABEL_CLS}>Owner</Label>
              <Input value={draft.owner} onChange={(e) => set({ owner: e.target.value })} className={FIELD_CLS} placeholder="Responsible owner" />
            </div>
          </div>
          <div>
            <Label className={LABEL_CLS}>Resolution</Label>
            <Textarea rows={2} value={draft.resolution} onChange={(e) => set({ resolution: e.target.value })} placeholder="Fix / workaround / decision" />
          </div>
          <div>
            <Label className={LABEL_CLS}>Retest Status</Label>
            <Select value={draft.retestStatus} onValueChange={(v) => set({ retestStatus: v })}>
              <SelectTrigger className={FIELD_CLS}><SelectValue /></SelectTrigger>
              <SelectContent>{RETEST_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        <SheetFooter className="mt-6 gap-2">
          {active && (
            <Button variant="ghost" onClick={handleDelete} className="text-destructive">
              <Trash2 className="w-4 h-4" /> Delete
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>{active ? 'Update Defect' : 'Create Defect'}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}