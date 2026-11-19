import { IncomingRequestGate } from '@/components/membership/ExplorerPolicyGate';
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MessageCircle, Check, X, HelpCircle } from 'lucide-react';
import { respondCircleInvitation, respondExperienceInvitation } from '@/api/supabaseClient';

import { useLocalization } from '@/lib/i18n/useLocalization';

const STATUS_KEYS = {
  pending: { label: 'connections.status.pending', className: 'bg-warning/10 text-warning' },
  accepted: { label: 'connections.status.accepted', className: 'bg-success/10 text-success' },
  maybe: { label: 'connections.status.maybe', className: 'bg-info/10 text-info' },
  declined: { label: 'connections.status.declined', className: 'bg-muted text-muted-foreground' },
  expired: { label: 'connections.status.expired', className: 'bg-muted text-muted-foreground' },
};

function InvitationCardBody({ invitation }) {
  const { t } = useLocalization();
  const navigate = useNavigate();
  const flight = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState(invitation?.status || 'pending');

  const handleRespond = async (newStatus) => {
    if (!invitation?.id || flight.current) return;
    flight.current = true; setBusy(true); setError('');
    try {
      const respond = invitation.invitation_type === 'circle' || invitation.circle_id
        ? respondCircleInvitation
        : respondExperienceInvitation;
      const updated = await respond(invitation.id, newStatus === 'maybe' ? 'later' : newStatus);
      if (!updated?.id) throw new Error('Invitation response was not saved.');
      setStatus(updated.status);
      window.dispatchEvent(new Event('nmood:feed-changed'));
    } catch { setError('This invitation could not be updated. Please refresh to check its status.'); }
    finally { flight.current = false; setBusy(false); }
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

      <div className="p-4 space-y-3">
        {(invitation.target_image || invitation.experience_image) && <img src={invitation.target_image || invitation.experience_image} alt="" className="w-full aspect-[4/3] rounded-xl object-cover" loading="lazy" onError={event => { event.currentTarget.hidden = true; }} />}
        <p className="font-semibold text-base break-words">{invitation.target_title || invitation.experience_title || 'Activity invitation'}</p>
        {status === 'accepted' && <>
          <p role="status" className="text-sm text-muted-foreground">Invitation accepted — you’ve joined.</p>
          <Button variant="outline" className="min-h-11 w-full" onClick={() => navigate(`/${invitation.invitation_type === 'circle' ? 'circle' : 'experience'}/${encodeURIComponent(invitation.target_id || invitation.experience_id)}`)}>Open {invitation.invitation_type === 'circle' ? 'Circle' : 'Experience'}</Button>
        </>}
      </div>

      {(invitation.message || invitation.personal_message) && (
        <div className="px-3 pb-3">
          <div className="flex items-start gap-2 p-2.5 rounded-xl bg-muted/50">
            <MessageCircle className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <p className="text-sm italic text-foreground/80">“{invitation.message || invitation.personal_message}”</p>
          </div>
        </div>
      )}

      {error && <p role="alert" className="px-3 pb-3 text-sm text-destructive">{error}</p>}
      {['pending','later','maybe'].includes(status) ? (
        <div className="flex gap-2 p-3 pt-0">
          <Button size="sm" className="flex-1 min-h-11 gap-1.5" disabled={busy} onClick={() => handleRespond('accepted')}>
            <Check className="w-3.5 h-3.5" /> {t('connections.request.accept')}
          </Button>
          <Button variant="outline" size="sm" className="flex-1 min-h-11 gap-1.5" disabled={busy} onClick={() => handleRespond('maybe')}>
            <HelpCircle className="w-3.5 h-3.5" /> {t('connections.status.maybe')}
          </Button>
          <Button variant="outline" size="sm" className="flex-1 min-h-11 gap-1.5 text-destructive hover:text-destructive" disabled={busy} onClick={() => handleRespond('declined')}>
            <X className="w-3.5 h-3.5" /> {t('connections.request.decline')}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
export default function InvitationCard(props) { return <IncomingRequestGate><InvitationCardBody {...props} /></IncomingRequestGate>; }
