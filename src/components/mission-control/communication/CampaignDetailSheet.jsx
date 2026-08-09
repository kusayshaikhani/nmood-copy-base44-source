import React, { useEffect, useState } from 'react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Send, Copy, Pencil, XCircle, Archive, Trash2, RotateCcw } from 'lucide-react';
import { MCActivityTimeline } from '@/components/mission-control/ui';
import { listActivity } from '@/lib/admin-actions';
import {
  CHANNEL_LABEL, STATUS_BADGE, PRIORITY_BADGE, APPROVAL_LABEL,
  ANNOUNCEMENT_TYPE_BADGE,
} from '@/lib/communication-metrics';
import { useToast } from '@/components/ui/use-toast';
import { useLocalization } from '@/lib/i18n/useLocalization';

function Badge({ cls, children }) {
  return <span className={'text-[10px] px-2 py-0.5 rounded-full font-medium ' + cls}>{children}</span>;
}

function Stat({ label, value, color }) {
  return (
    <div className="rounded-lg border bg-card px-3 py-2">
      <p className="text-[10px] uppercase text-muted-foreground">{label}</p>
      <p className={'text-lg font-bold ' + (color || '')}>{value}</p>
    </div>
  );
}

export default function CampaignDetailSheet({ open, onOpenChange, item, onAction, onEdit }) {
  const { t } = useLocalization();
  const [activity, setActivity] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    if (!open || !item) return;
    listActivity('Campaign', item.id).then(setActivity).catch(() => setActivity([]));
  }, [open, item]);

  if (!item) return null;
  const ds = item.delivery_stats || {};
  const aud = item.actual_audience || item.estimated_audience || 0;
  const del = ds.delivered || 0;
  const deliveryRate = aud ? Math.round((del / aud) * 100) : 0;
  const openRate = del ? Math.round((ds.opened || 0) / del * 100) : 0;
  const clickRate = del ? Math.round((ds.clicked || 0) / del * 100) : 0;
  const canSend = item.status === 'draft' || item.status === 'scheduled';

  const copyId = () => { navigator.clipboard?.writeText(item.id || ''); toast({ title: 'Campaign ID copied' }); };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex flex-col gap-1">
            <span className="truncate">{item.name}</span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              <Badge cls="bg-muted text-muted-foreground">{CHANNEL_LABEL[item.type] || item.type}</Badge>
              <Badge cls={STATUS_BADGE[item.status] || 'bg-muted'}>{item.status}</Badge>
              <Badge cls={PRIORITY_BADGE[item.priority] || 'bg-muted'}>{item.priority}</Badge>
              {item.type === 'announcement' && <Badge cls={ANNOUNCEMENT_TYPE_BADGE[item.announcement_type] || 'bg-muted'}>{item.announcement_type}</Badge>}
            </div>
          </SheetTitle>
          <SheetDescription className="sr-only">{t('mission.campaign_details_and_delivery_analytics')}</SheetDescription>
        </SheetHeader>

        <div className="space-y-5 mt-4">
          <section>
            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">{t('mission.overview')}</h4>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <div><dt className="text-xs text-muted-foreground">{t('mission.approval')}</dt><dd>{APPROVAL_LABEL[item.approval_state] || item.approval_state}</dd></div>
              <div><dt className="text-xs text-muted-foreground">{t('mission.audience')}</dt><dd>{aud}</dd></div>
              <div><dt className="text-xs text-muted-foreground">{t('mission.sent_by')}</dt><dd>{item.sent_by || '—'}</dd></div>
              <div><dt className="text-xs text-muted-foreground">{t('mission.sent_at')}</dt><dd>{item.sent_at ? new Date(item.sent_at).toLocaleString() : '—'}</dd></div>
              {item.scheduled_at && <div><dt className="text-xs text-muted-foreground">{t('mission.scheduled')}</dt><dd>{new Date(item.scheduled_at).toLocaleString()}</dd></div>}
              {item.expiry_date && <div><dt className="text-xs text-muted-foreground">{t('mission.expires')}</dt><dd>{new Date(item.expiry_date).toLocaleString()}</dd></div>}
              <div className="col-span-2"><dt className="text-xs text-muted-foreground">{t('mission.campaign_id')}</dt><dd className="flex items-center gap-2"><span className="text-xs font-mono truncate">{item.id}</span><button onClick={copyId} className="text-xs text-primary hover:underline">{t('mission.copy')}</button></dd></div>
            </dl>
            {item.subject && <p className="text-sm font-medium mt-2">{item.subject}</p>}
            {item.body && <div className="text-sm text-muted-foreground mt-2 line-clamp-4" dangerouslySetInnerHTML={{ __html: item.body }} />}
          </section>

          <section>
            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">{t('mission.delivery_analytics')}</h4>
            <div className="grid grid-cols-3 gap-2">
              <Stat label="Delivered" value={del} color="text-success" />
              <Stat label="Failed" value={ds.failed || 0} color="text-destructive" />
              <Stat label="Pending" value={ds.pending || 0} color="text-warning" />
              <Stat label="Opened" value={ds.opened || 0} color="text-primary" />
              <Stat label="Clicked" value={ds.clicked || 0} color="text-primary" />
              {item.type === 'email' && <Stat label="Bounced" value={ds.bounced || 0} color="text-destructive" />}
              {item.type === 'email' && <Stat label="Unsubscribed" value={ds.unsubscribed || 0} color="text-muted-foreground" />}
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <Stat label="Delivery Rate" value={deliveryRate + '%'} color="text-success" />
              <Stat label="Open Rate" value={openRate + '%'} />
              <Stat label="Click Rate" value={clickRate + '%'} />
            </div>
          </section>

          <section>
            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">{t('mission.activity_timeline')}</h4>
            <MCActivityTimeline items={activity.map((a) => ({ id: a.id, title: a.action, subtitle: [a.administrator, a.details].filter(Boolean).join(' · '), time: a.created_date }))} />
          </section>

          <section>
            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">{t('mission.administrative_actions')}</h4>
            <div className="flex flex-wrap gap-2">
              {canSend && <Button size="sm" onClick={() => onAction(item, 'send')}><Send className="w-3.5 h-3.5" /> {t('mission.send_now')}</Button>}
              <Button size="sm" variant="outline" onClick={() => onEdit(item)}><Pencil className="w-3.5 h-3.5" /> {t('mission.edit')}</Button>
              <Button size="sm" variant="outline" onClick={() => onAction(item, 'duplicate')}><Copy className="w-3.5 h-3.5" /> {t('mission.duplicate')}</Button>
              {item.status === 'scheduled' && <Button size="sm" variant="outline" onClick={() => onAction(item, 'cancel')}><XCircle className="w-3.5 h-3.5" /> {t('mission.cancel_scheduled')}</Button>}
              {item.status === 'archived' ? (
                <Button size="sm" variant="outline" onClick={() => onAction(item, 'restore')}><RotateCcw className="w-3.5 h-3.5" /> {t('mission.restore')}</Button>
              ) : (
                <Button size="sm" variant="outline" onClick={() => onAction(item, 'archive')}><Archive className="w-3.5 h-3.5" /> {t('mission.archive')}</Button>
              )}
              {item.status === 'draft' && <Button size="sm" variant="destructive" onClick={() => onAction(item, 'delete')}><Trash2 className="w-3.5 h-3.5" /> {t('mission.delete_draft')}</Button>}
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}