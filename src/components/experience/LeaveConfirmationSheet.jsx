import React from 'react';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AsyncButton from '@/components/shared/AsyncButton';
import BottomSheet from '@/components/shared/BottomSheet';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function LeaveConfirmationSheet({ open, onOpenChange, onConfirm }) {
  const { t } = useLocalization();
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange}>
      <div className="text-center py-4">
        <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
          <LogOut className="w-7 h-7 text-destructive" />
        </div>
        <h2 className="font-semibold text-lg mb-2">{t('experiences.leave.title')}</h2>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-6">
          {t('experiences.leave.desc')}
        </p>
      </div>

      <div className="flex gap-3 pb-2">
        <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>{t('experiences.leave.stay')}</Button>
        <AsyncButton variant="destructive" className="flex-1" onClick={onConfirm}>{t('experiences.leave.leave')}</AsyncButton>
      </div>
    </BottomSheet>
  );
}