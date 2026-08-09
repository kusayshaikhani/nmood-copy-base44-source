import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, Calendar, Mail } from 'lucide-react';
import BottomSheet from '@/components/shared/BottomSheet';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function PalsAcceptedSheet({ pal, open, onOpenChange, onMessage }) {
  const { t } = useLocalization();
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange}>
      <div className="text-center py-2">
        <div className="text-5xl mb-3">🎉</div>
        <h2 className="font-semibold text-lg mb-1">{t('connections.accepted.title')}</h2>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-5">
          {t('connections.accepted.desc', { name: pal?.name || '' })}
        </p>

        <div className="space-y-2 mb-5 text-start">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
            <MessageCircle className="w-5 h-5 text-primary flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">{t('connections.accepted.private_chat')}</p>
              <p className="text-xs text-muted-foreground">{t('connections.accepted.private_chat_desc')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
            <Calendar className="w-5 h-5 text-primary flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">{t('connections.accepted.shared_experiences')}</p>
              <p className="text-xs text-muted-foreground">{t('connections.accepted.shared_experiences_desc')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
            <Mail className="w-5 h-5 text-primary flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">{t('connections.accepted.future_invitations')}</p>
              <p className="text-xs text-muted-foreground">{t('connections.accepted.future_invitations_desc')}</p>
            </div>
          </div>
        </div>

        <Button className="w-full" onClick={onMessage}>{t('connections.accepted.start_chatting')}</Button>
      </div>
    </BottomSheet>
  );
}