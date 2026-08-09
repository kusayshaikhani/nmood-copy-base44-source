import React, { useState } from 'react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAdminConfirm } from '@/components/admin/AdminConfirmProvider';
import { setTicketStatus } from '@/lib/admin-actions';
import { toast } from '@/components/ui/use-toast';
import { AppealStatusBadge } from '@/components/mission-control/trust-safety/MCTrustBadges';
import { ticketShortId, formatDate, formatRelative } from '@/lib/trust-safety-directory';
import { CheckCircle2, XCircle, RotateCcw, History } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

function Field({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm break-words" title={typeof value === 'string' ? value : undefined}>{value || '—'}</p>
    </div>
  );
}

export default function MCAppealSheet({ appeal, open, onOpenChange, onActioned }) {
  const { t } = useLocalization();
  const confirm = useAdminConfirm();
  const [note, setNote] = useState('');

  if (!appeal) return null;

  const finish = (label) => { toast({ title: label }); setNote(''); onActioned(); };

  const doAction = async (id, label, destructive = false) => {
    const ok = await confirm({ title: `${label}?`, description: 'This appeal decision is audit-logged.', confirmLabel: label, variant: destructive ? 'destructive' : 'default' });
    if (!ok) return;
    try {
      if (id === 'approve') await setTicketStatus(appeal.id, { status: 'resolved', response: note || 'Appeal approved' });
      else if (id === 'reject') await setTicketStatus(appeal.id, { status: 'resolved', response: note || 'Appeal rejected' });
      else if (id === 'reopen') await setTicketStatus(appeal.id, { status: 'open', response: note || 'Investigation reopened' });
      finish(label);
    } catch (e) {
      toast({ title: 'Action failed', description: e?.message || 'Please try again', variant: 'destructive' });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Appeal · {ticketShortId(appeal)}</SheetTitle>
          <SheetDescription>{t('mission.appeals_workspace_decisions_are_auditlogged')}</SheetDescription>
        </SheetHeader>

        <div className="flex items-center gap-2 mt-3">
          <AppealStatusBadge status={appeal.status} />
        </div>

        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-5 mb-2">{t('mission.appeal_information')}</h3>
        <div className="grid grid-cols-2 gap-3 rounded-xl border bg-card p-4">
          <Field label="Appeal ID" value={ticketShortId(appeal)} />
          <Field label="Appeal Date" value={formatDate(appeal.created_date)} />
          <Field label="Member" value={appeal.member_name} />
          <Field label="Email" value={appeal.member_email} />
          <Field label="Subject" value={appeal.subject} />
          <Field label="Reviewer" value={appeal.assigned_to || 'Unassigned'} />
          <div className="col-span-2"><Field label="Appeal Message" value={appeal.message} /></div>
        </div>

        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-5 mb-2 flex items-center gap-1"><History className="w-3.5 h-3.5" /> {t('mission.decision_history')}</h3>
        <div className="rounded-xl border bg-card p-4">
          {appeal.response ? (
            <div>
              <p className="text-sm">{appeal.response}</p>
              <p className="text-[10px] text-muted-foreground/70 mt-1">Updated {formatRelative(appeal.updated_date)}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t('mission.no_decision_recorded_yet')}</p>
          )}
          <p className="text-[10px] text-muted-foreground/70 mt-2">{t('mission.full_decision_history_requires_activity')}</p>
        </div>

        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-5 mb-2">{t('mission.appeal_actions')}</h3>
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('mission.optional_decision_note_auditlogged')} className="mb-2 min-h-[64px] resize-none" />
        <div className="grid grid-cols-1 gap-2 pb-6">
          <Button type="button" className="w-full gap-2" onClick={() => doAction('approve', 'Approve appeal')}>
            <CheckCircle2 className="w-4 h-4" /> {t('mission.approve_appeal')}
          </Button>
          <Button type="button" variant="destructive" className="w-full gap-2" onClick={() => doAction('reject', 'Reject appeal', true)}>
            <XCircle className="w-4 h-4" /> {t('mission.reject_appeal')}
          </Button>
          <Button type="button" variant="outline" className="w-full gap-2" onClick={() => doAction('reopen', 'Reopen investigation')}>
            <RotateCcw className="w-4 h-4" /> {t('mission.reopen_investigation')}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}