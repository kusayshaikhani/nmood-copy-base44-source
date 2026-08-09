import React, { useState } from 'react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Pencil, Trash2, LayoutTemplate, Sparkles } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { createTemplate, updateTemplate, deleteCommunication } from '@/lib/communication-actions';
import {
  CHANNELS, TEMPLATE_CATEGORIES, TEMPLATE_CATEGORY_LABEL, CHANNEL_LABEL,
} from '@/lib/communication-metrics';
import AsyncButton from '@/components/shared/AsyncButton';
import { useLocalization } from '@/lib/i18n/useLocalization';

const inputCls = 'h-9 px-3 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30';
function Field({ label, children, full }) {
  return <label className={'flex flex-col gap-1 text-xs ' + (full ? 'sm:col-span-2' : '')}><span className="font-medium text-muted-foreground">{label}</span>{children}</label>;
}

export default function TemplateLibrary({ templates, onUse, onSaved }) {
  const { t } = useLocalization();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', category: 'custom', type: 'in_app', title: '', subject: '', body: '' });

  const openNew = () => { setEditing(null); setForm({ name: '', category: 'custom', type: 'in_app', title: '', subject: '', body: '' }); setOpen(true); };
  const openEdit = (t) => { setEditing(t); setForm({ name: t.name, category: t.category, type: t.type, title: t.title || '', subject: t.subject || '', body: t.body || '' }); setOpen(true); };
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.name.trim()) { toast({ title: 'Template name required', variant: 'destructive' }); return; }
    const record = { name: form.name.trim(), category: form.category, type: form.type, title: form.title, subject: form.subject, body: form.body };
    if (editing) await updateTemplate(editing.id, record); else await createTemplate(record);
    toast({ title: editing ? 'Template updated' : 'Template created' });
    setOpen(false); onSaved();
  };

  const remove = async (t) => {
    if (!confirm(`Delete template "${t.name}"?`)) return;
    await deleteCommunication('CampaignTemplate', t.id);
    toast({ title: 'Template deleted' });
    onSaved();
  };

  return (
    <div className="rounded-xl border bg-card p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold flex items-center gap-2"><LayoutTemplate className="w-4 h-4 text-primary" /> {t('mission.quick_templates')}</h3>
        <Button size="sm" variant="outline" onClick={openNew}><Plus className="w-3.5 h-3.5" /> {t('mission.new_template')}</Button>
      </div>
      {templates.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">{t('mission.no_templates_yet_create_reusable')}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {templates.map((t) => (
            <div key={t.id} className="rounded-lg border bg-background p-3 flex flex-col">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">{TEMPLATE_CATEGORY_LABEL[t.category] || t.category}</span>
                <span className="text-[10px] text-muted-foreground">{CHANNEL_LABEL[t.type]}</span>
              </div>
              <p className="text-sm font-medium truncate">{t.name}</p>
              {t.title && <p className="text-xs text-muted-foreground truncate">{t.title}</p>}
              {t.body && <p className="text-xs text-muted-foreground/70 line-clamp-2 mt-1">{(t.body || '').replace(/<[^>]*>/g, '')}</p>}
              <div className="flex gap-1.5 mt-3 pt-2 border-t">
                <Button size="sm" className="h-7 text-xs flex-1" onClick={() => onUse(t)}><Sparkles className="w-3 h-3" /> {t('mission.use')}</Button>
                <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => openEdit(t)} aria-label={t('mission.edit_template')}><Pencil className="w-3 h-3" /></Button>
                {!t.is_default && <Button size="sm" variant="outline" className="h-7 w-7 p-0 text-destructive" onClick={() => remove(t)} aria-label={t('mission.delete_template')}><Trash2 className="w-3 h-3" /></Button>}
              </div>
            </div>
          ))}
        </div>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editing ? 'Edit Template' : 'New Template'}</SheetTitle>
            <SheetDescription className="sr-only">{t('mission.create_a_reusable_campaign_template')}</SheetDescription>
          </SheetHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            <Field label="Template Name" full><input value={form.name} onChange={(e) => set('name', e.target.value)} className={inputCls} /></Field>
            <Field label="Category">
              <select value={form.category} onChange={(e) => set('category', e.target.value)} className={inputCls}>
                {TEMPLATE_CATEGORIES.map((c) => <option key={c} value={c}>{TEMPLATE_CATEGORY_LABEL[c]}</option>)}
              </select>
            </Field>
            <Field label="Channel">
              <select value={form.type} onChange={(e) => set('type', e.target.value)} className={inputCls}>
                {CHANNELS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </Field>
            <Field label="Title" full><input value={form.title} onChange={(e) => set('title', e.target.value)} className={inputCls} /></Field>
            <Field label="Subject (Email)" full><input value={form.subject} onChange={(e) => set('subject', e.target.value)} className={inputCls} /></Field>
            <Field label="Body" full><Textarea value={form.body} onChange={(e) => set('body', e.target.value)} rows={4} /></Field>
          </div>
          <div className="flex gap-2 mt-4">
            <AsyncButton onClick={save}>{t('mission.save_template')}</AsyncButton>
            <Button variant="ghost" onClick={() => setOpen(false)}>{t('admin.cancel')}</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}