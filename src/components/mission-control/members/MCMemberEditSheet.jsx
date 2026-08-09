import React, { useEffect, useState } from 'react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import AsyncButton from '@/components/shared/AsyncButton';
import { updateMember } from '@/lib/admin-actions';
import { toast } from '@/components/ui/use-toast';
import { useLocalization } from '@/lib/i18n/useLocalization';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'deactivated', label: 'Deactivated' },
  { value: 'banned', label: 'Banned' },
  { value: 'deleted', label: 'Deleted (soft)' },
];

export default function MCMemberEditSheet({ member, open, onOpenChange, onSaved }) {
  const { t } = useLocalization();
  const [form, setForm] = useState({});

  useEffect(() => {
    if (member) {
      setForm({
        display_name: member.display_name || '',
        email: member.email || '',
        phone: member.phone || '',
        country: member.country || '',
        city: member.city || '',
        bio: member.bio || '',
        admin_status: member.admin_status || 'active',
        admin_note: member.admin_note || '',
      });
    }
  }, [member]);

  if (!member) return null;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    await updateMember(member.id, form);
    toast({ title: 'Profile updated' });
    onSaved?.();
    onOpenChange?.(false);
  };

  const inputCls = 'h-9 px-3 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t('mission.edit_profile')}</SheetTitle>
          <SheetDescription>{t('mission.administrative_edit_changes_are_auditlogged')}</SheetDescription>
        </SheetHeader>
        <div className="space-y-3 px-1 pb-6">
          <div>
            <Label className="text-xs">{t('mission.display_name')}</Label>
            <Input value={form.display_name || ''} onChange={(e) => set('display_name', e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">{t('mission.email')}</Label>
            <Input value={form.email || ''} onChange={(e) => set('email', e.target.value)} className="mt-1" type="email" />
          </div>
          <div>
            <Label className="text-xs">{t('mission.phone')}</Label>
            <Input value={form.phone || ''} onChange={(e) => set('phone', e.target.value)} className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">{t('mission.country')}</Label>
              <Input value={form.country || ''} onChange={(e) => set('country', e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">{t('mission.city')}</Label>
              <Input value={form.city || ''} onChange={(e) => set('city', e.target.value)} className="mt-1" />
            </div>
          </div>
          <div>
            <Label className="text-xs">{t('admin.bio')}</Label>
            <Textarea value={form.bio || ''} onChange={(e) => set('bio', e.target.value)} className="mt-1 min-h-[80px] resize-none" />
          </div>
          <div>
            <Label className="text-xs">{t('admin.account_status')}</Label>
            <select value={form.admin_status} onChange={(e) => set('admin_status', e.target.value)} className={'mt-1 w-full ' + inputCls}>
              {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-xs">{t('mission.admin_note')}</Label>
            <Textarea value={form.admin_note || ''} onChange={(e) => set('admin_note', e.target.value)} className="mt-1 min-h-[60px] resize-none" />
          </div>
        </div>
        <SheetFooter>
          <AsyncButton className="w-full" onClick={save} successLabel="Saved">{t('admin.save_changes')}</AsyncButton>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}