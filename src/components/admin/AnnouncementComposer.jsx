import React, { useState } from 'react';
import BottomSheet from '@/components/shared/BottomSheet';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createAnnouncementRecord, sendAnnouncement } from '@/lib/admin-actions';
import { toast } from '@/components/ui/use-toast';
import { useLocalization } from '@/lib/i18n/useLocalization';

const AUDIENCES = [
  { value: 'all', label: 'All Members' },
  { value: 'premium', label: 'Premium Members' },
  { value: 'city', label: 'Members in a City' },
  { value: 'country', label: 'Members in a Country' },
];

export default function AnnouncementComposer({ open, onOpenChange, onCreated }) {
  const { t } = useLocalization();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState('all');
  const [targetValue, setTargetValue] = useState('');
  const [sending, setSending] = useState(false);

  const reset = () => {
    setTitle('');
    setBody('');
    setAudience('all');
    setTargetValue('');
  };

  const needsValue = audience === 'city' || audience === 'country';

  const submit = async () => {
    if (!title.trim() || !body.trim()) {
      toast({ title: 'Title and body are required', variant: 'destructive' });
      return;
    }
    if (needsValue && !targetValue.trim()) {
      toast({ title: `Enter a ${audience}`, variant: 'destructive' });
      return;
    }
    setSending(true);
    try {
      const record = await createAnnouncementRecord({
        title: title.trim(),
        body: body.trim(),
        audience,
        target_value: needsValue ? targetValue.trim() : '',
        status: 'draft',
        reach: 0,
      });
      const reach = await sendAnnouncement(record);
      toast({ title: `Announcement sent to ${reach} member${reach === 1 ? '' : 's'}` });
      reset();
      onOpenChange(false);
      if (onCreated) onCreated();
    } catch (e) {
      toast({ title: 'Failed to send', description: e?.message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title={t('admin.new_announcement')} footerLabel={sending ? 'Sending…' : 'Send Announcement'} onFooterAction={submit}>
      <div className="space-y-3 pb-4">
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">{t('admin.title')}</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('admin.announcement_title')} />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">{t('admin.message')}</label>
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} placeholder={t('admin.write_your_announcement')} />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">{t('admin.target_audience')}</label>
          <div className="grid grid-cols-2 gap-1.5">
            {AUDIENCES.map((a) => (
              <button
                key={a.value}
                type="button"
                onClick={() => setAudience(a.value)}
                className={'px-3 py-2 rounded-lg text-xs font-medium transition-default border ' +
                  (audience === a.value ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground hover:bg-muted/50')}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
        {needsValue && (
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">{audience === 'city' ? 'City' : 'Country'}</label>
            <Input value={targetValue} onChange={(e) => setTargetValue(e.target.value)} placeholder={audience === 'city' ? 'e.g. Dubai' : 'e.g. United Arab Emirates'} />
          </div>
        )}
      </div>
    </BottomSheet>
  );
}