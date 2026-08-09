import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import BottomSheet from '@/components/shared/BottomSheet';
import AsyncButton from '@/components/shared/AsyncButton';
import { base44 } from '@/api/base44Client';
import { emitActivityChange } from '@/lib/activity-store';
import { feedback } from '@/lib/feedback';
import { useLocalization } from '@/lib/i18n/useLocalization';

const inputClass = 'w-full h-11 px-3.5 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-default';

export default function EditExperienceSheet({ open, onOpenChange, entity, onSaved }) {
  const { t } = useLocalization();
  const [form, setForm] = useState(null);

  useEffect(() => {
    if (entity) {
      setForm({
        title: entity.title || '',
        description: entity.description || '',
        date: entity.date || '',
        time: entity.time || '',
        location: entity.location || '',
        location_address: entity.location_address || '',
        max_participants: entity.max_participants || 20,
        visibility: entity.visibility || 'public',
      });
    }
  }, [entity]);

  if (!form) return null;

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    try {
      const updated = await base44.entities.Experience.update(entity.id, {
        title: form.title.trim(),
        description: form.description.trim(),
        date: form.date,
        time: form.time,
        location: form.location,
        location_address: form.location_address,
        max_participants: Number(form.max_participants) || 20,
        visibility: form.visibility,
      });
      emitActivityChange();
      feedback.success('experienceUpdated');
      onSaved?.(updated);
      onOpenChange(false);
    } catch (err) {
      feedback.error(err);
      throw err;
    }
  };

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title={t('experiences.edit.title')} description="Update the details of your experience.">
      <div className="space-y-3 pb-2">
        <div>
          <label className="text-sm font-medium mb-1.5 block">{t('hosting.wizard.step_title')}</label>
          <Input value={form.title} onChange={(e) => set('title', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">{t('hosting.step_basic.description')}</label>
          <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={3} className={inputClass + ' resize-none'} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium mb-1.5 block">{t('hosting.step_datetime.date')}</label>
            <Input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">{t('experiences.confirm.time')}</label>
            <Input type="time" value={form.time} onChange={(e) => set('time', e.target.value)} className={inputClass} />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">{t('hosting.step_location.venue')}</label>
          <Input value={form.location} onChange={(e) => set('location', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">{t('hosting.step_location.address')}</label>
          <Input value={form.location_address} onChange={(e) => set('location_address', e.target.value)} className={inputClass} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium mb-1.5 block">{t('experiences.edit.max_participants')}</label>
            <Input type="number" min="1" value={form.max_participants} onChange={(e) => set('max_participants', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">{t('circles.edit.visibility')}</label>
            <select value={form.visibility} onChange={(e) => set('visibility', e.target.value)} className={inputClass}>
              <option value="public">{t('hosting.activity.visibility_public')}</option>
              <option value="connections">{t('onboarding.privacy.connections_only')}</option>
              <option value="private">{t('community.detail.private')}</option>
            </select>
          </div>
        </div>
        <AsyncButton className="w-full mt-2" onClick={handleSave} successLabel="Saved">{t('experiences.edit.save_changes')}</AsyncButton>
      </div>
    </BottomSheet>
  );
}