import React, { useState, useEffect } from 'react';
import BottomSheet from '@/components/shared/BottomSheet';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { setCircleStatus } from '@/lib/admin-actions';
import { toast } from '@/components/ui/use-toast';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function CircleEditSheet({ circle, open, onOpenChange, onUpdated }) {
  const { t } = useLocalization();
  const [form, setForm] = useState({});

  useEffect(() => {
    if (circle) {
      setForm({
        name: circle.name || '',
        description: circle.description || '',
        category: circle.category || '',
        location: circle.location || '',
        budget: circle.budget || '',
      });
    }
  }, [circle]);

  if (!circle) return null;

  const save = async () => {
    try {
      await setCircleStatus(circle.id, form);
      toast({ title: 'Circle updated' });
      onOpenChange(false);
      if (onUpdated) onUpdated();
    } catch (e) {
      toast({ title: 'Update failed', variant: 'destructive' });
    }
  };

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title={t('admin.edit_circle')} footerLabel="Save Changes" onFooterAction={save}>
      <div className="space-y-3 pb-4">
        <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">{t('admin.description')}</label>
          <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Category" value={form.category} onChange={(v) => setForm({ ...form, category: v })} />
          <Field label="Budget" value={form.budget} onChange={(v) => setForm({ ...form, budget: v })} />
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