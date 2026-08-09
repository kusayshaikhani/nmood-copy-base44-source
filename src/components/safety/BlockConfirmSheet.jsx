import React from 'react';
import BottomSheet from '@/components/shared/BottomSheet';
import AsyncButton from '@/components/shared/AsyncButton';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Ban } from 'lucide-react';
import { useSafety } from '@/lib/safety-store';
import { feedback } from '@/lib/feedback';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function BlockConfirmSheet({ open, onOpenChange, member }) {
  const { t } = useLocalization();
  const { block } = useSafety();
  if (!member) return null;

  const handleBlock = async () => {
    await block(member);
    feedback.success('blocked');
    onOpenChange(false);
  };

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title={t('safety.block.title')} description={t('safety.block.description')}>
      <div className="pb-2">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted mb-4">
          <Avatar className="w-10 h-10">
            <AvatarImage src={member.avatar} alt={member.name} />
            <AvatarFallback>{member.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <p className="text-sm font-medium">{member.name}</p>
        </div>
        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
          {t('safety.block.desc_full')}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>{t('safety.block.cancel')}</Button>
          <AsyncButton variant="destructive" className="flex-1 gap-2" onClick={handleBlock}>
            <Ban className="w-4 h-4" /> {t('safety.block.confirm')}
          </AsyncButton>
        </div>
      </div>
    </BottomSheet>
  );
}