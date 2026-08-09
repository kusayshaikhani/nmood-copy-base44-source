import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { hardDeleteRecord } from '@/lib/admin-actions';
import { toast } from '@/components/ui/use-toast';

const Ctx = createContext(null);

/**
 * Founder/Admin hard-delete confirmation flow. Renders the required
 * "cannot be undone" warning, an optional reason field, then invokes the
 * server-side hardDeleteRecord action. Server authorization is enforced in
 * the backend; the client never decides eligibility.
 */
export function HardDeleteProvider({ children }) {
  const [state, setState] = useState({ open: false });
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const resolveRef = useRef(null);

  const requestHardDelete = useCallback((opts) => {
    setReason('');
    setBusy(false);
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setState({ open: true, ...opts });
    });
  }, []);

  const finish = (val) => {
    resolveRef.current?.(val);
    resolveRef.current = null;
    setState({ open: false });
  };

  const onConfirm = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await hardDeleteRecord(state.entity, state.id, reason);
      const d = res?.data || {};
      toast({
        title: 'Record permanently deleted',
        description: d.related_deleted ? `${d.related_deleted} related record(s) removed.` : undefined,
      });
      finish({ ok: true });
    } catch (e) {
      toast({
        title: 'Hard delete failed',
        description: e?.message || 'Please try again',
        variant: 'destructive',
      });
      setBusy(false);
    }
  };

  return (
    <Ctx.Provider value={{ requestHardDelete }}>
      {children}
      <AlertDialog open={state.open} onOpenChange={(o) => !o && !busy && finish({ ok: false })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{state.title || 'Permanently delete record?'}</AlertDialogTitle>
            <AlertDialogDescription>
              This action permanently deletes the selected item and cannot be undone.
              {state.label ? ` “${state.label}”` : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-1 space-y-2">
            <Label htmlFor="hd-reason">Reason (optional)</Label>
            <Textarea
              id="hd-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. test data, policy violation, duplicate…"
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy} onClick={() => finish({ ok: false })}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={(e) => { e.preventDefault(); onConfirm(); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {busy ? 'Deleting…' : 'Delete Permanently'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Ctx.Provider>
  );
}

export const useHardDelete = () => useContext(Ctx);