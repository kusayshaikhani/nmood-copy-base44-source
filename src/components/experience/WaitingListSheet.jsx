import React from 'react';
import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BottomSheet from '@/components/shared/BottomSheet';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function WaitingListSheet({ experience, open, onOpenChange, onConfirm }) {
  const { t } = useLocalization();
  if (!experience) return null;

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange}>
      <div className="text-center py-4">
        <div className="w-14 h-14 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-4">
          <Users className="w-7 h-7 text-warning" />
        </div>
        <h2 className="font-semibold text-lg mb-2">{t('experiences.waiting.full_title')}</h2>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-6">
          {t('experiences.waiting.desc')}
        </p>
      </div>

      <div className="flex gap-3 pb-2">
        <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>{t('hosting.create.cancel')}</Button>
        <Button className="flex-1" onClick={onConfirm}>{t('experiences.waiting.join')}</Button>
      </div>
    </BottomSheet>
  );
}