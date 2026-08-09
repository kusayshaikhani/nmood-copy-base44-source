import React from 'react';
import { Compass, Users, User, ChevronRight } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function ShareMessage({ type, content, isMe }) {
  const { t } = useLocalization();
  const cardBg = isMe ? 'bg-primary-foreground/15' : 'bg-card border border-border';
  const labelColor = isMe ? 'text-primary-foreground/70' : 'text-muted-foreground';
  const textColor = isMe ? 'text-primary-foreground' : 'text-foreground';

  if (type === 'activity_share') {
    return (
      <div className={cardBg + ' rounded-xl overflow-hidden w-52'}>
        <img src={content.image} alt={content.title} className="w-full h-24 object-cover" />
        <div className="p-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <Compass className="w-3 h-3 " />
            <span className={'text-xs font-medium ' + labelColor}>{t('messaging.share.activity')}</span>
          </div>
          <p className={'text-sm font-semibold mb-1 ' + textColor}>{content.title}</p>
          <p className={'text-xs ' + labelColor}>{content.time} · {content.distance}</p>
        </div>
      </div>
    );
  }

  if (type === 'circle_share') {
    return (
      <div className={cardBg + ' rounded-xl overflow-hidden w-52'}>
        <img src={content.image} alt={content.name} className="w-full h-24 object-cover" />
        <div className="p-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <Users className="w-3 h-3" />
            <span className={'text-xs font-medium ' + labelColor}>{t('messaging.share.circle')}</span>
          </div>
          <p className={'text-sm font-semibold mb-1 ' + textColor}>{content.name}</p>
          <p className={'text-xs ' + labelColor}>{t('messaging.share.members', { count: Number(content.members) || 0 })}</p>
        </div>
      </div>
    );
  }

  if (type === 'profile_share') {
    return (
      <div className={cardBg + ' rounded-xl p-3 w-52 flex items-center gap-2.5'}>
        <img src={content.avatar} alt={content.name} className="w-10 h-10 rounded-full object-cover" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <User className="w-3 h-3" />
            <span className={'text-xs font-medium ' + labelColor}>{t('messaging.share.profile')}</span>
          </div>
          <p className={'text-sm font-semibold truncate ' + textColor}>{content.name}</p>
          <p className={'text-xs truncate ' + labelColor}>{content.bio}</p>
        </div>
        <ChevronRight className={'w-4 h-4 flex-shrink-0 ' + labelColor} />
      </div>
    );
  }

  return null;
}