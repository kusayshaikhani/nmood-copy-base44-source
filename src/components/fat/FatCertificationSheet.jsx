import React, { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { ShieldCheck } from 'lucide-react';
import { useFatExecution, CERT_APPROVALS, CERT_STATUSES } from '@/lib/fat-execution-store.jsx';

const LABEL_CLS = 'text-xs font-semibold mb-1 block';

export default function FatCertificationSheet({ suiteId, module, open, onOpenChange }) {
  const { state, setCertification } = useFatExecution();
  const cert = state.certifications[suiteId] || { approval: 'pending', date: '', comments: '', status: 'Not Certified' };
  const [draft, setDraft] = useState(cert);

  useEffect(() => { if (open) setDraft(cert); /* eslint-disable-next-line */ }, [open, suiteId]);

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));

  const approve = (value) => {
    set({
      approval: value,
      date: value === 'approved' ? new Date().toISOString().slice(0, 10) : draft.date,
      status: value === 'approved' ? 'Certified' : value === 'rejected' ? 'Rejected' : draft.status,
    });
  };

  const save = () => {
    setCertification(suiteId, draft);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Founder Certification</SheetTitle>
          <SheetDescription>Module: {module}</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          <div>
            <Label className={LABEL_CLS}>Founder Approval</Label>
            <div className="flex gap-2">
              {CERT_APPROVALS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => approve(opt.value)}
                  className={'flex-1 px-3 py-2 rounded-md text-xs font-medium transition-default ' + (draft.approval === opt.value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70')}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className={LABEL_CLS}>Date</Label>
              <input
                type="date"
                value={draft.date || ''}
                onChange={(e) => set({ date: e.target.value })}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
              />
            </div>
            <div>
              <Label className={LABEL_CLS}>Certification Status</Label>
              <Select value={draft.status} onValueChange={(v) => set({ status: v })}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>{CERT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className={LABEL_CLS}>Comments</Label>
            <Textarea rows={4} value={draft.comments || ''} onChange={(e) => set({ comments: e.target.value })} placeholder="Founder certification notes…" />
          </div>
        </div>

        <SheetFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save}>Save Certification</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}