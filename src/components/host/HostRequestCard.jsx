import React, { useState } from 'react';
import { Check, X, BadgeCheck, Languages } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function HostRequestCard({ request }) {
  const { t } = useLocalization();
  const [status, setStatus] = useState('pending');

  if (status !== 'pending') {
    const isApproved = status === 'approved';
    const bannerClass = isApproved ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive';
    return (
      <Card className="p-4">
        <div className="flex items-center gap-3 mb-3 opacity-60">
          <Avatar className="w-10 h-10">
            <AvatarImage src={request.memberAvatar} alt={request.memberName} />
            <AvatarFallback>{request.memberName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">{request.memberName}</h3>
            <p className="text-xs text-muted-foreground truncate">{request.activityTitle}</p>
          </div>
        </div>
        <div className={'text-center py-2 rounded-xl text-sm font-medium ' + bannerClass}>
          {isApproved ? 'Approved' : 'Declined'}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3 mb-3">
        <Avatar className="w-12 h-12">
          <AvatarImage src={request.memberAvatar} alt={request.memberName} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {request.memberName.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <h3 className="font-semibold text-sm truncate">
                {request.memberName}, {request.memberAge}
              </h3>
              {request.verified && (
                <BadgeCheck className="w-4 h-4 text-primary flex-shrink-0" />
              )}
            </div>
            <span className="text-xs text-muted-foreground flex-shrink-0">{request.joinedDate}</span>
          </div>
          <p className="text-xs text-primary truncate">{request.activityTitle}</p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-2.5 leading-relaxed">{request.bio}</p>

      <div className="flex flex-wrap gap-1.5 mb-2">
        {request.languages.map((lang) => (
          <span
            key={lang}
            className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground flex items-center gap-1"
          >
            <Languages className="w-2.5 h-2.5" />
            {lang}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {request.mutualInterests.map((interest) => (
          <span
            key={interest}
            className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary"
          >
            {interest}
          </span>
        ))}
      </div>

      <div className="flex gap-2 mb-2">
        <Button size="sm" className="flex-1 gap-1.5" onClick={() => setStatus('approved')}>
          <Check className="w-3.5 h-3.5" />
          {t('common.approve')}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1 gap-1.5 text-destructive hover:bg-destructive/5"
          onClick={() => setStatus('declined')}
        >
          <X className="w-3.5 h-3.5" />
          {t('hosting.request.decline')}
        </Button>
      </div>

      <button className="w-full text-center text-xs text-primary font-medium py-1">{t('messaging.header.view_profile')}</button>
    </Card>
  );
}