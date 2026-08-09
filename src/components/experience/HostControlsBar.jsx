import React, { useState } from 'react';
import { Pencil, Ban, Lock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BottomSheet from '@/components/shared/BottomSheet';
import { base44 } from '@/api/base44Client';
import { emitActivityChange } from '@/lib/activity-store';
import { useLocalization } from '@/lib/i18n/useLocalization';

// Host-only action bar shown on Experience Detail for experiences the user owns.
export default function HostControlsBar({ entity, onEdit, onChanged }) {
  const { t } = useLocalization();
  const [confirm, setConfirm] = useState(null); // 'cancel' | 'close' | null
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

  if (isCancelled) {
    return (
      <div className="p-4 rounded-2xl border border-destructive/30 bg-destructive/5 flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-destructive">{t('experiences.host.cancelled')}</p>
          <p className="text-xs text-muted-foreground">{t('experiences.host.cancel_notified')}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-4 rounded-2xl border border-primary/20 bg-primary/5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-primary">{t('experiences.host.controls')}</span>
          {isClosed && <span className="text-[10px] px-2 py-0.5 rounded-full bg-warning/15 text-warning font-medium">{t('circles.actionbar.registrations_closed')}</span>}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={onEdit}>
            <Pencil className="w-3.5 h-3.5" /> {t('hosting.activity.edit')}
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" disabled={busy} onClick={() => setConfirm('close')}>
            <Lock className="w-3.5 h-3.5" /> {isClosed ? t('experiences.host.reopen') : t('experiences.host.close')}
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive" disabled={busy} onClick={() => setConfirm('cancel')}>
            <Ban className="w-3.5 h-3.5" /> {t('hosting.create.cancel')}
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