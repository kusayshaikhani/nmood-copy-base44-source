import React, { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { hardDeleteMember } from '@/lib/admin-actions';
import { fullName, memberShortId } from '@/lib/member-directory';
import { toast } from '@/components/ui/use-toast';
import { useLocalization } from '@/lib/i18n/useLocalization';

/**
 * Rehearsal-only, single-account irreversible confirmation. The selected account
 * is named in the dialog and an authorized administrator must type DELETE.
 */
export default function DevHardDeleteDialog({ targets, open, onClose, onSuccess }) {
  const { t } = useLocalization();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const list = Array.isArray(targets) ? targets : [];
  const count = list.length;

  useEffect(() => {
    if (open) {
      setText('');
      setBusy(false);
    }
  }, [open, count]);

  const confirm = async () => {
    if (text.trim() !== 'DELETE' || busy || count === 0) return;
    setBusy(true);
    let ok = 0;
    const failed = [];
    for (const m of list) {
      try {
        await hardDeleteMember(m.id, text.trim());
        ok++;
      } catch {
        failed.push(m);
      }
    }
    if (failed.length === 0) {
      toast({
        title: count === 1 ? 'Member permanently deleted' : `${ok} members permanently deleted`,
        description: 'The named account and its owned data were permanently removed.',
      });
      onSuccess?.();
      onClose?.();
    } else {
      toast({
        title: `Deleted ${ok}, ${failed.length} failed`,
        description: 'Some members could not be deleted. They may already be removed.',
        variant: 'destructive',
      });
      setBusy(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onClose?.()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-4 h-4" /> Permanently delete account
          </AlertDialogTitle>
          <AlertDialogDescription>
            This irreversible action removes the named authentication account, owned content, groups, related records and media. Other members’ accounts are preserved.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {count === 1 && list[0] && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
            <p className="font-medium">{fullName(list[0])}</p>
            <p className="text-xs text-muted-foreground font-mono">
              {memberShortId(list[0])} · {list[0].email || '—'}
            </p>
          </div>
        )}
        {count > 1 && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
            <p className="font-medium">{count} members selected</p>
            <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
              {list.slice(0, 4).map((m) => (
                <li key={m.id} className="truncate">{fullName(m)} · {m.email || '—'}</li>
              ))}
              {count > 4 && <li className="text-muted-foreground">+{count - 4} more…</li>}
            </ul>
          </div>
        )}

        <div>
          <p className="text-sm text-muted-foreground mb-1.5">
            {t('mission.type')} <span className="font-mono font-semibold text-foreground">{t('mission.delete')}</span> {t('mission.to_continue')}
          </p>
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t('mission.delete')}
            disabled={busy}
            aria-label={t('mission.type_delete_to_confirm')}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose} disabled={busy}>{t('admin.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => { e.preventDefault(); confirm(); }}
            disabled={text.trim() !== 'DELETE' || busy || count === 0}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {busy ? 'Deleting…' : 'Permanently Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}