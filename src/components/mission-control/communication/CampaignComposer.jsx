import React, { useEffect, useState } from 'react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import AsyncButton from '@/components/shared/AsyncButton';
import { Send, Clock, Save, Eye } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useToast } from '@/components/ui/use-toast';
import {
  createCampaign, updateCampaign, sendCampaign, estimateAudience,
} from '@/lib/communication-actions';
import {
  CHANNELS, PRIORITY_OPTIONS, ANNOUNCEMENT_TYPES,
} from '@/lib/communication-metrics';
import AudienceTargeting from './AudienceTargeting';
import MessagePreview from './MessagePreview';
import { useLocalization } from '@/lib/i18n/useLocalization';

const QUILL_MODULES = {
  toolbar: [['bold', 'italic', 'underline'], [{ list: 'bullet' }, { list: 'ordered' }], ['link'], ['clean']],
};

function deriveOptions(members, circles, experiences) {
  const uniq = (arr) => [...new Set(arr.filter(Boolean))].sort();
  const toOpts = (arr) => arr.map((v) => ({ value: v, label: v }));
  return {
    countries: toOpts(uniq(members.map((m) => m.country))),
    cities: toOpts(uniq(members.map((m) => m.city))),
    languages: toOpts(uniq(members.flatMap((m) => m.languages || []))),
    interests: toOpts(uniq(members.flatMap((m) => m.interests || []))),
    circles: circles.map((c) => ({ value: c.id, label: c.name })).filter((o) => o.label),
    experiences: experiences.map((e) => ({ value: String(e.id), label: e.title })).filter((o) => o.label),
  };
}

function FormField({ label, children, full }) {
  return (
    <label className={'flex flex-col gap-1 text-xs ' + (full ? 'sm:col-span-2' : '')}>
      <span className="font-medium text-muted-foreground">{label}</span>{children}
    </label>
  );
}
const inputCls = 'h-9 px-3 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30';

export default function CampaignComposer({ open, onOpenChange, onSaved, editing, prefill, defaultType = 'in_app' }) {
  const { t } = useLocalization();
  const { toast } = useToast();
  const src = editing || prefill || {};
  const [form, setForm] = useState(() => ({
    name: editing?.name || '', type: src.type || defaultType || 'in_app',
    title: src.title || '', subject: src.subject || '', body: src.body || '',
    image_url: src.image_url || '', cta_label: src.cta_label || '', cta_url: src.cta_url || '',
    icon: src.icon || '', priority: src.priority || 'normal', expiry_date: (src.expiry_date || '').slice(0, 16),
    announcement_type: src.announcement_type || 'information', announcement_display: src.announcement_display || 'dismissible',
    template_id: prefill?.id || editing?.template_id || '',
  }));
  const [audience, setAudience] = useState(() => src.audience_filters || {});
  const [delivery, setDelivery] = useState(() => (editing?.status === 'scheduled' ? 'schedule' : 'draft'));
  const [scheduledAt, setScheduledAt] = useState(() => (editing?.scheduled_at || '').slice(0, 16));
  const [estimate, setEstimate] = useState(editing?.estimated_audience || 0);
  const [estimating, setEstimating] = useState(false);
  const [options, setOptions] = useState({ countries: [], cities: [], languages: [], interests: [], circles: [], experiences: [] });
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (!open) return;
    let active = true;
    (async () => {
      const { base44 } = await import('@/api/base44Client');
      const [m, c, e] = await Promise.all([
        base44.functions.invoke('adminConsole', { mode: 'list', entity: 'Member' }),
        base44.functions.invoke('adminConsole', { mode: 'list', entity: 'Circle' }),
        base44.functions.invoke('adminConsole', { mode: 'list', entity: 'Experience' }),
      ]);
      const ex = (r) => Array.isArray(r?.data) ? r.data : (r?.data?.data || []);
      if (active) setOptions(deriveOptions(ex(m), ex(c), ex(e)));
    })();
    return () => { active = false; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(async () => {
      setEstimating(true);
      try { const c = await estimateAudience(audience); setEstimate(c || 0); } catch { /* ignore */ }
      finally { setEstimating(false); }
    }, 450);
    return () => clearTimeout(t);
  }, [open, audience]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const isAnnouncement = form.type === 'announcement';
  const isEmail = form.type === 'email';

  const buildRecord = () => ({
    name: form.name.trim(), type: form.type, title: form.title, subject: form.subject,
    body: form.body, image_url: form.image_url, cta_label: form.cta_label, cta_url: form.cta_url,
    icon: form.icon, priority: form.priority,
    expiry_date: form.expiry_date ? new Date(form.expiry_date).toISOString() : undefined,
    audience_filters: audience, estimated_audience: estimate,
    announcement_type: form.announcement_type, announcement_display: form.announcement_display,
    template_id: form.template_id || undefined,
    status: delivery === 'schedule' ? 'scheduled' : 'draft',
    scheduled_at: delivery === 'schedule' && scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
  });

  const handleSubmit = async (mode) => {
    if (!form.name.trim()) { toast({ title: 'Campaign name is required', variant: 'destructive' }); return; }
    if (mode === 'schedule' && !scheduledAt) { toast({ title: 'Schedule time is required', variant: 'destructive' }); return; }
    const record = buildRecord();
    let id = editing?.id;
    if (editing) await updateCampaign(editing.id, record);
    else { const created = await createCampaign(record); id = created?.id; }
    if (mode === 'now' && id) {
      const res = await sendCampaign(id);
      toast({ title: `Campaign sent to ${res?.audience ?? 0} members` });
    } else if (mode === 'schedule') {
      toast({ title: 'Campaign scheduled' });
    } else {
      toast({ title: 'Draft saved' });
    }
    onSaved();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{editing ? 'Edit Campaign' : 'New Campaign'}</SheetTitle>
          <SheetDescription className="sr-only">{t('mission.compose_a_communication_campaign')}</SheetDescription>
        </SheetHeader>

        <div className="space-y-5 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Campaign Name" full>
              <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder={t('mission.eg_summer_welcome_push')} className={inputCls} />
            </FormField>
            <FormField label="Channel">
              <select value={form.type} onChange={(e) => set('type', e.target.value)} className={inputCls}>
                {CHANNELS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </FormField>
            <FormField label="Priority">
              <select value={form.priority} onChange={(e) => set('priority', e.target.value)} className={inputCls}>
                {PRIORITY_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </FormField>
            <FormField label="Title / Headline" full>
              <input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder={t('mission.notification_title')} className={inputCls} />
            </FormField>
            {isEmail && (
              <FormField label="Email Subject" full>
                <input value={form.subject} onChange={(e) => set('subject', e.target.value)} placeholder={t('mission.subject_line')} className={inputCls} />
              </FormField>
            )}
            <FormField label="Message Body" full>
              <div className="rounded-lg overflow-hidden border border-border">
                <ReactQuill theme="snow" value={form.body} onChange={(v) => set('body', v)} modules={QUILL_MODULES} placeholder={t('mission.write_your_message')} />
              </div>
            </FormField>
            <FormField label="Image URL">
              <input value={form.image_url} onChange={(e) => set('image_url', e.target.value)} placeholder={t('mission.https')} className={inputCls} />
            </FormField>
            <FormField label="Icon (lucide name)">
              <input value={form.icon} onChange={(e) => set('icon', e.target.value)} placeholder={t('mission.bell')} className={inputCls} />
            </FormField>
            <FormField label="CTA Button Label">
              <input value={form.cta_label} onChange={(e) => set('cta_label', e.target.value)} placeholder={t('mission.learn_more')} className={inputCls} />
            </FormField>
            <FormField label="CTA URL">
              <input value={form.cta_url} onChange={(e) => set('cta_url', e.target.value)} placeholder={t('mission.https')} className={inputCls} />
            </FormField>
            <FormField label="Expiry Date">
              <input type="datetime-local" value={form.expiry_date} onChange={(e) => set('expiry_date', e.target.value)} className={inputCls} />
            </FormField>
            {isAnnouncement && (
              <>
                <FormField label="Announcement Type">
                  <select value={form.announcement_type} onChange={(e) => set('announcement_type', e.target.value)} className={inputCls}>
                    {ANNOUNCEMENT_TYPES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                  </select>
                </FormField>
                <FormField label="Display">
                  <select value={form.announcement_display} onChange={(e) => set('announcement_display', e.target.value)} className={inputCls}>
                    <option value="dismissible">{t('mission.dismissible')}</option><option value="persistent">{t('mission.persistent')}</option>
                  </select>
                </FormField>
              </>
            )}
          </div>

          <section>
            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">{t('admin.target_audience')}</h4>
            <AudienceTargeting filters={audience} onChange={setAudience} options={options} estimate={estimate} estimating={estimating} />
          </section>

          {showPreview && (
            <section>
              <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">{t('mission.preview')}</h4>
              <MessagePreview campaign={form} />
            </section>
          )}

          <section>
            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">{t('mission.delivery')}</h4>
            <div className="flex flex-wrap gap-2 mb-3">
              {[['now', 'Send Immediately'], ['schedule', 'Schedule'], ['draft', 'Save as Draft']].map(([v, l]) => (
                <button key={v} onClick={() => setDelivery(v)}
                  className={'px-3 py-1.5 rounded-lg text-xs font-medium border transition-default ' +
                    (delivery === v ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground hover:bg-muted/50')}>{l}</button>
              ))}
              <button onClick={() => setShowPreview((s) => !s)} className="px-3 py-1.5 rounded-lg text-xs font-medium border bg-card border-border text-muted-foreground hover:bg-muted/50 inline-flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{showPreview ? 'Hide' : 'Preview'}</button>
            </div>
            {delivery === 'schedule' && (
              <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className={inputCls} />
            )}
          </section>

          <div className="flex flex-wrap gap-2 pt-2 border-t">
            <AsyncButton onClick={() => handleSubmit('now')} disabled={delivery !== 'now'}><Send className="w-4 h-4" /> {t('mission.send_now')}</AsyncButton>
            <AsyncButton onClick={() => handleSubmit('schedule')} disabled={delivery !== 'schedule'}><Clock className="w-4 h-4" /> {t('mission.schedule')}</AsyncButton>
            <AsyncButton onClick={() => handleSubmit('draft')} disabled={delivery !== 'draft'}><Save className="w-4 h-4" /> {t('mission.save_draft')}</AsyncButton>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>{t('admin.cancel')}</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}