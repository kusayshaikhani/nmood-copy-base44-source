import React, { useState } from 'react';
import { Ban, Lock, AlertTriangle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BottomSheet from '@/components/shared/BottomSheet';
import { base44 } from '@/api/base44Client';
import { emitActivityChange } from '@/lib/activity-store';
import { useLocalization } from '@/lib/i18n/useLocalization';

// Host-only action bar shown on Experience Detail for experiences the user owns.
export default function HostControlsBar({ entity, onEdit, onChanged, onDelete }) {
  const { t } = useLocalization();
  const [confirm, setConfirm] = useState(null); // 'cancel' | 'close' | 'delete' | null
  const [busy, setBusy] = useState(false);

  if (!entity) return null;
  const isClosed = entity.status === 'closed';
  const isCancelled = entity.status === 'cancelled';

  const runAction = async (action) => {
    setBusy(true);
    try {
      let updated;
      if (action === 'cancel') {
        updated = await base44.entities.Experience.update(entity.id, { status: 'cancelled' });
      } else if (action === 'close') {
        updated = await base44.entities.Experience.update(entity.id, { status: isClosed ? 'active' : 'closed' });
      }
      emitActivityChange();
      onChanged?.(updated);
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  };

  const cancelledNotice = isCancelled ? (
      <div className="mb-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-destructive">{t('experiences.host.cancelled')}</p>
          <p className="text-xs text-muted-foreground">{t('experiences.host.cancel_notified')}</p>
        </div>
      </div>
  ) : null;

  return (
    <>
      <div className="p-4 rounded-2xl border border-primary/20 bg-primary/5">
        {cancelledNotice}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-primary">{t('experiences.host.controls')}</span>
          {isClosed && <span className="text-[10px] px-2 py-0.5 rounded-full bg-warning/15 text-warning font-medium">{t('circles.actionbar.registrations_closed')}</span>}
        </div>
        <div className="space-y-3 pb-[calc(18px+env(safe-area-inset-bottom,0px))]" data-testid="experience-host-action-sheet">
          {!isCancelled && <Button variant="outline" size="sm" className="w-full" disabled={busy} onClick={onEdit}>
            Edit Experience
          </Button>}
          {!isCancelled && <div className="grid grid-cols-2 gap-2 min-w-0" data-testid="experience-host-icon-row">
          <Button variant="outline" size="sm" className="gap-1.5 min-w-0 overflow-hidden" disabled={busy} onClick={() => setConfirm('close')}>
            <Lock className="w-3.5 h-3.5" /> {isClosed ? t('experiences.host.reopen') : t('experiences.host.close')}
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 min-w-0 overflow-hidden text-destructive hover:text-destructive" disabled={busy} onClick={() => setConfirm('cancel')}>
            <Ban className="w-3.5 h-3.5" /> {t('hosting.create.cancel')}
          </Button>
          </div>}
          <Button variant="destructive" size="sm" className="w-full gap-1.5" disabled={busy} onClick={() => setConfirm('delete')}>
            <Trash2 className="w-3.5 h-3.5" /> Delete Experience
          </Button>
        </div>
      </div>

      <BottomSheet
        open={confirm === 'cancel'}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={t('experiences.host.cancel_confirm')}
        description={t('experiences.host.cancel_desc')}
      >
        <div className="flex gap-2 pb-2">
          <Button variant="outline" className="flex-1" onClick={() => setConfirm(null)}>{t('experiences.host.keep')}</Button>
          <Button variant="destructive" className="flex-1" disabled={busy} onClick={() => runAction('cancel')}>{t('experiences.my.cancel_yes')}</Button>
        </div>
      </BottomSheet>

      <BottomSheet
        open={confirm === 'delete'}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Delete Experience permanently?"
        description="This permanently cancels the Experience and removes its attendance and chat. Joined attendees will be notified that it was cancelled by its host. This cannot be undone."
      >
        <div className="flex gap-2 pb-2">
          <Button variant="outline" className="flex-1" disabled={busy} onClick={() => setConfirm(null)}>Keep Experience</Button>
          <Button variant="destructive" className="flex-1" disabled={busy} onClick={async () => {
            setBusy(true);
            try { await onDelete?.(); setConfirm(null); }
            finally { setBusy(false); }
          }}>{busy ? 'Deleting…' : 'Delete Permanently'}</Button>
        </div>
      </BottomSheet>

      <BottomSheet
        open={confirm === 'close'}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={isClosed ? t('experiences.host.reopen_title') : t('experiences.host.close_title')}
        description={isClosed ? t('experiences.host.reopen_desc') : t('experiences.host.close_desc')}
      >
        <div className="flex gap-2 pb-2">
          <Button variant="outline" className="flex-1" onClick={() => setConfirm(null)}>{t('common.dismiss')}</Button>
          <Button className="flex-1" disabled={busy} onClick={() => runAction('close')}>{isClosed ? t('experiences.host.reopen') : t('experiences.host.close')}</Button>
        </div>
      </BottomSheet>
    </>
  );
}
