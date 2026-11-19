import React, { useMemo, useState } from 'react';
import { useLocalization } from '@/lib/i18n/useLocalization';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAdminConfirm } from '@/components/admin/AdminConfirmProvider';
import { moderateSafetyReport } from '@/api/adminData';
import { toast } from '@/components/ui/use-toast';
import {
  ReportStatusBadge, PriorityBadge, ReportTypeBadge,
} from '@/components/mission-control/trust-safety/MCTrustBadges';
import {
  reportShortId, formatDate, relatedReports,
  REPORT_TYPE_LABELS,
} from '@/lib/trust-safety-directory';
import {
  Ban, ShieldOff, AlertTriangle, Clock, CheckCircle2, Brain, FileText, History, Paperclip,
} from 'lucide-react';

function Field({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm break-words" title={typeof value === 'string' ? value : undefined}>{value || '—'}</p>
    </div>
  );
}

function ActionBtn({ icon: Icon, label, onClick, destructive }) {
  return (
    <Button type="button" variant="outline" size="sm" className={'gap-1.5 justify-start ' + (destructive ? 'border-destructive/30 text-destructive hover:bg-destructive/10' : '')} onClick={onClick}>
      <Icon className="w-3.5 h-3.5" /> {label}
    </Button>
  );
}

export default function MCReportSheet({ report, reports, memberByUserId, memberById, open, onOpenChange, onActioned }) {
  const { t } = useLocalization();
  const confirm = useAdminConfirm();
  const [note, setNote] = useState('');

  const related = useMemo(() => relatedReports(reports, report), [reports, report]);
  const reportedMember = report?.target_type === 'member'
    ? (memberByUserId[report?.reported_member_id] || memberById[report?.reported_member_id] || null)
    : null;

  if (!report) return null;


  const finish = (label) => { toast({ title: label }); setNote(''); onActioned(); };

  const act = {
    dismiss: () => moderateSafetyReport(report.id, 'dismiss', note || 'No violation found').then(() => finish('Report dismissed')),
    warn: () => moderateSafetyReport(report.id, 'warn', note || 'Community Guidelines warning').then(() => finish('Warning issued')),
    restrict: () => moderateSafetyReport(report.id, 'restrict_messaging', note || 'Temporary safety restriction', 24).then(() => finish('Messaging restricted for 24 hours')),
    suspend: () => moderateSafetyReport(report.id, 'suspend', note || 'Account suspended after human review').then(() => finish('Member suspended')),
    ban: () => moderateSafetyReport(report.id, 'ban', note || 'Permanent ban after human review').then(() => finish('Member banned')),
  };

  const doAction = async (id, label, destructive = false) => {
    const ok = await confirm({ title: `${label}?`, description: 'This moderation decision is audit-logged.', confirmLabel: label, variant: destructive ? 'destructive' : 'default' });
    if (!ok) return;
    try { await act[id](); }
    catch (e) { toast({ title: 'Action failed', description: e?.message || 'Please try again', variant: 'destructive' }); }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Investigation · {reportShortId(report)}</SheetTitle>
          <SheetDescription>{t('mission.private_moderation_workspace_actions_are')}</SheetDescription>
        </SheetHeader>

        <div className="flex items-center gap-2 mt-3">
          <ReportStatusBadge status={report.status} />
          <PriorityBadge priority={report.priority} />
          <ReportTypeBadge type={report.target_type} />
        </div>

        {/* Report information */}
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-5 mb-2 flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> {t('mission.report_information')}</h3>
        <div className="grid grid-cols-2 gap-3 rounded-xl border bg-card p-4">
          <Field label="Report ID" value={reportShortId(report)} />
          <Field label="Submitted" value={formatDate(report.created_date)} />
          <Field label="Category" value={report.reason} />
          <Field label="Type" value={REPORT_TYPE_LABELS[report.target_type] || report.target_type} />
          <div className="col-span-2"><Field label="Description" value={report.details} /></div>
          {report.target_image && (
            <div className="col-span-2">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1"><Paperclip className="w-3 h-3" /> {t('mission.attachment')}</p>
              <img src={report.target_image} alt={t('mission.reported_content')} className="mt-1 rounded-lg max-h-32 object-cover border border-border" />
            </div>
          )}
        </div>

        {/* Reporting member */}
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-5 mb-2">{t('mission.reporting_member')}</h3>
        <div className="grid grid-cols-2 gap-3 rounded-xl border bg-card p-4">
          <Field label="Reporter" value="Confidential — visible only in this private queue" />
          <Field label="Privacy" value="Identity is never disclosed to the reported member" />
        </div>

        {/* Reported entity */}
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-5 mb-2">{t('mission.reported_entity')}</h3>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3">
            {report.target_type === 'member' || report.target_image ? (
              <Avatar className="w-10 h-10">
                {report.target_image ? <AvatarImage src={report.target_image} /> : null}
                <AvatarFallback className="bg-muted text-xs">{(report.target_name || '?').slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
            ) : null}
            <div className="min-w-0">
              <p className="font-medium truncate">{report.target_name || '—'}</p>
              <p className="text-xs text-muted-foreground">{REPORT_TYPE_LABELS[report.target_type] || report.target_type}</p>
            </div>
          </div>
          {report.target_type === 'message' && (
            <p className="text-[10px] text-muted-foreground mt-2">{t('mission.only_the_reported_message_content')}</p>
          )}
        </div>

        {/* Related history */}
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-5 mb-2 flex items-center gap-1"><History className="w-3.5 h-3.5" /> {t('mission.related_history')}</h3>
        <div className="rounded-xl border bg-card p-4 space-y-2">
          <p className="text-xs text-muted-foreground">{t('mission.previous_reports_against_this_target')} <span className="text-foreground font-medium">{related.length}</span></p>
          {reportedMember && (
            <p className="text-xs text-muted-foreground">{t('mission.current_standing')} <span className="text-foreground font-medium capitalize">{reportedMember.admin_status || 'active'}</span></p>
          )}
          {related.slice(0, 3).map((r) => (
            <div key={r.id} className="flex items-center justify-between text-xs">
              <span className="truncate">{r.reason || '—'}</span>
              <span className="text-muted-foreground">{formatDate(r.created_date)}</span>
            </div>
          ))}
          <p className="text-[10px] text-muted-foreground/70">{t('mission.full_warningssuspensionsappeals_history_requires_activity')}</p>
        </div>

        {/* AI assistance (reserved) */}
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-5 mb-2 flex items-center gap-1"><Brain className="w-3.5 h-3.5" /> {t('mission.ai_assistance')}</h3>
        <div className="grid grid-cols-2 gap-3 rounded-xl border border-dashed bg-card/50 p-4">
          <Field label="AI Risk Score" value="—" />
          <Field label="Suggested Action" value="—" />
          <Field label="Confidence Level" value="—" />
          <Field label="Policy References" value="—" />
        </div>
        <p className="text-[10px] text-muted-foreground/70 mt-1.5">{t('mission.aiassisted_moderation_is_reserved_and')}</p>

        {/* Moderation actions */}
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-5 mb-2">{t('mission.moderation_actions')}</h3>
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('mission.optional_note_resolution_reason_auditlogged')} className="mb-2 min-h-[64px] resize-none" />
        <div className="grid grid-cols-2 gap-2 pb-6">
          <ActionBtn icon={AlertTriangle} label="Issue Warning" destructive onClick={() => doAction('warn', 'Issue warning', true)} />
          <ActionBtn icon={Clock} label="Restrict Messages 24h" destructive onClick={() => doAction('restrict', 'Restrict messaging', true)} />
          <ActionBtn icon={ShieldOff} label="Suspend Member" destructive onClick={() => doAction('suspend', 'Suspend member', true)} />
          <ActionBtn icon={Ban} label="Ban Member" destructive onClick={() => doAction('ban', 'Ban member', true)} />
          <ActionBtn icon={CheckCircle2} label="Dismiss Report" destructive onClick={() => doAction('dismiss', 'Dismiss report', true)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}