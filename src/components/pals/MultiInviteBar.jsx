import React from 'react';
import { Mail, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function MultiInviteBar({ count, onInvite, onCancel }) {
  const { t } = useLocalization();
  if (count === 0) return null;
  return (
    <div className="fixed bottom-16 md:bottom-4 inset-x-0 z-30 px-4 py-3 bg-background/90 backdrop-blur-xl border-t border-border">
      <div className="max-w-2xl mx-auto flex items-center gap-3">
        <span className="text-sm font-medium">{t('connections.multi.selected', { count })}</span>
        <Button variant="ghost" size="sm" onClick={onCancel} className="gap-1.5">
          <X className="w-4 h-4" /> {t('connections.action.cancel')}
        </Button>
        <Button className="ms-auto gap-2" onClick={onInvite}>
          <Mail className="w-4 h-4" /> {t('connections.multi.invite')}
        </Button>
      </div>
    </div>
  );
}