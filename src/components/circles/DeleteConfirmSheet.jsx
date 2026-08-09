import React from 'react';
import BottomSheet from '@/components/shared/BottomSheet';
import { Button } from '@/components/ui/button';
import AsyncButton from '@/components/shared/AsyncButton';
import { Trash2, AlertTriangle } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function DeleteConfirmSheet({ open, onOpenChange, memberCount, onConfirm }) {
  const { t } = useLocalization();
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title={t('circles.delete.title')}>
      <div className="space-y-3">
        <div className="flex items-start gap-2 text-sm">
          <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            {memberCount > 0 && (
              <p className="text-muted-foreground">{t('circles.delete.member_count')}<span className="font-semibold text-foreground">{memberCount} members</span>.</p>
            )}
            <p className="text-muted-foreground">{t('circles.delete.permanent')}</p>
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
          <AsyncButton variant="destructive" className="flex-1 gap-1.5" onClick={onConfirm}><Trash2 className="w-4 h-4" />{t('circles.delete.delete_btn')}</AsyncButton>
        </div>
      </div>
    </BottomSheet>
  );
}