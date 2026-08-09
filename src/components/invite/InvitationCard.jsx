import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, Wallet, MessageCircle, Check, X, HelpCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLocalization } from '@/lib/i18n/useLocalization';

const STATUS_KEYS = {
  pending: { label: 'connections.status.pending', className: 'bg-warning/10 text-warning' },
  accepted: { label: 'connections.status.accepted', className: 'bg-success/10 text-success' },
  maybe: { label: 'connections.status.maybe', className: 'bg-info/10 text-info' },
  declined: { label: 'connections.status.declined', className: 'bg-muted text-muted-foreground' },
  expired: { label: 'connections.status.expired', className: 'bg-muted text-muted-foreground' },
};

export default function InvitationCard({ invitation }) {
  const { t } = useLocalization();
  const navigate = useNavigate();
  const [status, setStatus] = useState(invitation?.status || 'pending');

  const handleRespond = async (newStatus) => {
    setStatus(newStatus);
    try {
      if (invitation?.id) await base44.entities.Invitation.update(invitation.id, { status: newStatus });
    } catch {}
  };

  if (!invitation) return null;
  const config = STATUS_KEYS[status] || STATUS_KEYS.pending;

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-3 p-3 border-b border-border">
        <Avatar className="w-10 h-10 flex-shrink-0">
          <AvatarImage src={invitation.sender_avatar} alt={invitation.sender_name} />
          <AvatarFallback className="bg-primary/10 text-primary text-sm">{invitation.sender_name?.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{invitation.sender_name}</p>
          <p className="text-xs text-muted-foreground">{t('connections.invitation.invited_you')}</p>
        </div>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${config.className}`}>
          {t(config.label)}
        </span>
      </div>

      <button onClick={() => navigate(`/experience/${invitation.experience_id}`)} type="button" className="block w-full text-start">
        <img src={invitation.experience_image} alt={invitation.experience_title} className="w-full h-32 object-cover" loading="lazy" />
        <div className="p-3">
          <p className="font-semibold text-sm">{invitation.experience_title}</p>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3 flex-shrink-0" /><span className="truncate">{invitation.experience_date}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="w-3 h-3 flex-shrink-0" /><span className="truncate">{invitation.experience_time}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3 flex-shrink-0" /><span className="truncate">{invitation.experience_venue}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Wallet className="w-3 h-3 flex-shrink-0" /><span className="truncate">{invitation.experience_budget}</span>
            </div>
          </div>
        </div>
      </button>

      {invitation.personal_message && (
        <div className="px-3 pb-3">
          <div className="flex items-start gap-2 p-2.5 rounded-xl bg-muted/50">
            <MessageCircle className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <p className="text-sm italic text-foreground/80">“{invitation.personal_message}”</p>
          </div>
        </div>
      )}

      {status === 'pending' ? (
        <div className="flex gap-2 p-3 pt-0">
          <Button size="sm" className="flex-1 h-9 gap-1.5" onClick={() => handleRespond('accepted')}>
            <Check className="w-3.5 h-3.5" /> {t('connections.request.accept')}
          </Button>
          <Button variant="outline" size="sm" className="flex-1 h-9 gap-1.5" onClick={() => handleRespond('maybe')}>
            <HelpCircle className="w-3.5 h-3.5" /> {t('connections.status.maybe')}
          </Button>
          <Button variant="outline" size="sm" className="flex-1 h-9 gap-1.5 text-destructive hover:text-destructive" onClick={() => handleRespond('declined')}>
            <X className="w-3.5 h-3.5" /> {t('connections.request.decline')}
          </Button>
        </div>
      ) : (
        <div className="p-3 pt-0">
          <Button variant="outline" size="sm" className="w-full h-9" onClick={() => handleRespond('pending')}>
            {t('connections.invitation.change_response')}
          </Button>
        </div>
      )}
    </div>
  );
}