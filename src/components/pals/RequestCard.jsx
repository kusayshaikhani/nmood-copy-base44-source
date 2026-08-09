import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Calendar, Check, X, Clock } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { relativeTime } from '@/lib/i18n/format';

const STATUS_KEYS = {
  accepted: 'connections.status.accepted',
  declined: 'connections.status.declined',
  cancelled: 'connections.status.cancelled',
};

export default function RequestCard({ request, onAccept, onDecline, onCancel }) {
  const { t, lang } = useLocalization();
  const { name, avatar, sharedInterests, sharedExperience, requestDate, type, status } = request;
  const showActions = type === 'incoming'
    ? !status || status === 'pending'
    : status === 'pending';
  const statusMeta = type === 'outgoing' && status && status !== 'pending' ? STATUS_KEYS[status] : null;

  return (
    <div className="p-4 rounded-2xl border border-border bg-card">
      <div className="flex gap-3 mb-2">
        <Avatar className="w-12 h-12 flex-shrink-0">
          <AvatarImage src={avatar} alt={name} />
          <AvatarFallback className="bg-primary/10 text-primary">{(name || 'U').charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate">{name}</h3>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" /> {relativeTime(requestDate, lang, t)}
          </p>
        </div>
        {statusMeta && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{t(statusMeta)}</span>
        )}
      </div>

      {sharedExperience && (
        <div className="flex items-center gap-1.5 mb-2 text-xs text-muted-foreground">
          <Calendar className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{t('connections.request.met_at', { name: sharedExperience })}</span>
        </div>
      )}

      {sharedInterests?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {sharedInterests.map((i) => (
            <span key={i} className="text-[10px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">{i}</span>
          ))}
        </div>
      )}

      {showActions && type === 'incoming' && (
        <div className="flex gap-2">
          <Button size="sm" className="flex-1 h-9 gap-1.5" onClick={() => onAccept?.(request)}><Check className="w-3.5 h-3.5" /> {t('connections.request.accept')}</Button>
          <Button variant="outline" size="sm" className="flex-1 h-9 text-destructive hover:text-destructive" onClick={() => onDecline?.(request)}><X className="w-3.5 h-3.5" /> {t('connections.request.decline')}</Button>
        </div>
      )}
      {showActions && type === 'outgoing' && (
        <Button variant="outline" size="sm" className="w-full h-9 text-destructive hover:text-destructive" onClick={() => onCancel?.(request)}>{t('connections.request.cancel')}</Button>
      )}
    </div>
  );
}