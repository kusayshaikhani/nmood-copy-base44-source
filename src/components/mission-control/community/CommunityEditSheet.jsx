import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import AsyncButton from '@/components/shared/AsyncButton';
import { updateExperience, updateCircle } from '@/lib/admin-actions';
import { useToast } from '@/components/ui/use-toast';
import { useLocalization } from '@/lib/i18n/useLocalization';

const EXP_STATUSES = ['active', 'closed', 'cancelled', 'completed'];
const CIRCLE_STATUSES = ['active', 'draft', 'paused', 'archived'];
const VISIBILITIES = ['public', 'connections', 'private'];

export default function CommunityEditSheet({ open, onOpenChange, item, type, onSaved }) {
  const { t } = useLocalization();
  const [form, setForm] = useState({});
  const { toast } = useToast();

  useEffect(() => {
    if (item) setForm({
      ...(type === 'experience' ? { title: item.title } : { name: item.name }),
      description: item.description || '',
      category: item.category || '',
      location: item.location || '',
      visibility: item.visibility || 'public',
      status: item.status || 'active',
      is_featured: !!item.is_featured,
      is_hidden: !!item.is_hidden,
    });
  }, [item, type]);

  if (!item) return null;
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    const patch = { ...form };
    if (type === 'experience') await updateExperience(item.id, patch);
    else await updateCircle(item.id, patch);
    toast({ title: `${type === 'experience' ? 'Experience' : 'Circle'} updated` });
    onOpenChange(false);
    onSaved?.();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit {type === 'experience' ? 'Experience' : 'Circle'}</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <div className="space-y-1.5">
            <Label>{type === 'experience' ? 'Title' : 'Name'}</Label>
            <Input value={form[type === 'experience' ? 'title' : 'name'] || ''} onChange={(e) => set(type === 'experience' ? 'title' : 'name', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{t('admin.description')}</Label>
            <Textarea value={form.description || ''} onChange={(e) => set('description', e.target.value)} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t('mission.category')}</Label>
              <Input value={form.category || ''} onChange={(e) => set('category', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>{t('mission.location')}</Label>
              <Input value={form.location || ''} onChange={(e) => set('location', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t('mission.visibility')}</Label>
              <select value={form.visibility} onChange={(e) => set('visibility', e.target.value)} className="w-full h-9 px-3 rounded-lg bg-card border border-border text-sm">
                {VISIBILITIES.map((v) => <option key={v} value={v} className="capitalize">{v}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>{t('admin.status')}</Label>
              <select value={form.status} onChange={(e) => set('status', e.target.value)} className="w-full h-9 px-3 rounded-lg bg-card border border-border text-sm">
                {(type === 'experience' ? EXP_STATUSES : CIRCLE_STATUSES).map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <label className="text-sm inline-flex items-center gap-2"><input type="checkbox" checked={form.is_featured} onChange={(e) => set('is_featured', e.target.checked)} className="accent-primary" /> {t('admin.featured')}</label>
            <label className="text-sm inline-flex items-center gap-2"><input type="checkbox" checked={form.is_hidden} onChange={(e) => set('is_hidden', e.target.checked)} className="accent-primary" /> {t('admin.hidden')}</label>
          </div>
        </div>
        <SheetFooter className="mt-6">
          <AsyncButton onClick={save} className="w-full">{t('mission.save_changes')}</AsyncButton>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}