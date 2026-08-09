import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AsyncButton from '@/components/shared/AsyncButton';
import { updateExperience, updateCircle } from '@/lib/admin-actions';
import { useToast } from '@/components/ui/use-toast';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function CommunityTransferSheet({ open, onOpenChange, item, type, onSaved }) {
  const { t } = useLocalization();
  const [hostName, setHostName] = useState('');
  const [hostUserId, setHostUserId] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (item) { setHostName(item.host_name || ''); setHostUserId(item.host_user_id || ''); }
  }, [item]);

  if (!item) return null;

  const transfer = async () => {
    const patch = { host_name: hostName };
    if (type === 'experience' && hostUserId) patch.host_user_id = hostUserId;
    if (type === 'experience') await updateExperience(item.id, patch);
    else await updateCircle(item.id, patch);
    toast({ title: 'Ownership transferred' });
    onOpenChange(false);
    onSaved?.();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>{t('mission.transfer_ownership')}</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <div className="space-y-1.5">
            <Label>New {type === 'experience' ? 'Host' : 'Owner'} Name</Label>
            <Input value={hostName} onChange={(e) => setHostName(e.target.value)} placeholder={t('mission.name')} />
          </div>
          {type === 'experience' && (
            <div className="space-y-1.5">
              <Label>{t('mission.new_host_user_id')}</Label>
              <Input value={hostUserId} onChange={(e) => setHostUserId(e.target.value)} placeholder={t('mission.member_user_id')} />
            </div>
          )}
          <p className="text-xs text-muted-foreground">The original creator retains the record; only hosting attribution changes.</p>
        </div>
        <SheetFooter className="mt-6">
          <AsyncButton onClick={transfer} className="w-full" disabled={!hostName.trim()}>{t('mission.transfer_ownership_2')}</AsyncButton>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}