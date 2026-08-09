import React, { useState, useEffect } from 'react';
import BottomSheet from '@/components/shared/BottomSheet';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { setExperienceStatus } from '@/lib/admin-actions';
import { toast } from '@/components/ui/use-toast';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function ExperienceEditSheet({ experience, open, onOpenChange, onUpdated }) {
  const { t } = useLocalization();
  const [form, setForm] = useState({});

  useEffect(() => {
    if (experience) {
      setForm({
        title: experience.title || '',
        description: experience.description || '',
        category: experience.category || '',
        date: experience.date || '',
        time: experience.time || '',
        location: experience.location || '',
        budget: experience.budget || '',
      });
    }
  }, [experience]);

  if (!experience) return null;

  const save = async () => {
    try {
      await setExperienceStatus(experience.id, form);
      toast({ title: 'Experience updated' });
      onOpenChange(false);
      if (onUpdated) onUpdated();
    } catch (e) {
      toast({ title: 'Update failed', variant: 'destructive' });
    }
  };

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title={t('admin.edit_experience')} footerLabel="Save Changes" onFooterAction={save}>
      <div className="space-y-3 pb-4">
        <Field label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">{t('admin.description')}</label>
          <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Category" value={form.category} onChange={(v) => setForm({ ...form, category: v })} />
          <Field label="Budget" value={form.budget} onChange={(v) => setForm({ ...form, budget: v })} />
          <Field label="Date" value={form.date} onChange={(v) => setForm({ ...form, date: v })} />
          <Field label="Time" value={form.time} onChange={(v) => setForm({ ...form, time: v })} />
        </div>
        <Field label="Location" value={form.location} onChange={(v) => setForm({ ...form, location: v })} />
      </div>
    </BottomSheet>
  );
}

function Field({ label, value, onChange }) {
  return (
    <div>
      <label className="text-xs font-semibold text-muted-foreground mb-1 block">{label}</label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}