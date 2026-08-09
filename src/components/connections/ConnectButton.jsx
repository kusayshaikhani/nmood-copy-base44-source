import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Check, Clock, Lock, ShieldBan, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';
import { useConnections, sendRequest } from '@/lib/connections-store';
import { useSafety } from '@/lib/safety-store';
import { useMembershipAccess } from '@/components/membership/MembershipProvider';
import { FEATURES } from '@/lib/permission-engine';
import { getRelationship, RELATIONSHIP_STATES } from '@/lib/relationship-state';
import { useToast } from '@/components/ui/use-toast';
import { haptic } from '@/lib/haptics';
import { trackMembershipEvent, MEMBERSHIP_EVENTS } from '@/lib/membership-analytics';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function ConnectButton({ member, size = 'sm', variant = 'default', className = '', fullWidth = true }) {
  const { t } = useLocalization();
  const { user } = useAuth();
  const conn = useConnections(user);
  const { isBlocked } = useSafety();
  const { check, showUpgrade, recordUsage, isPremium } = useMembershipAccess();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [sending, setSending] = useState(false);
  const [optimisticSent, setOptimisticSent] = useState(false);

  const state = getRelationship(member?.id, {
    connections: conn.connections,
    outgoing: conn.outgoing,
    incoming: conn.incoming,
    isBlocked,
  });

  const base = 'flex items-center justify-center gap-1.5 ' + (fullWidth ? 'flex-1 ' : '') + className;

  if (state === RELATIONSHIP_STATES.BLOCKED) {
    return (
      <Button size={size} variant="secondary" disabled className={base}>
        <ShieldBan className="w-3.5 h-3.5" /> {t('connections.connect.blocked')}
      </Button>
    );
  }
  if (state === RELATIONSHIP_STATES.CONNECTED) {
    return (
      <Button size={size} variant="secondary" className={base} onClick={() => navigate(`/messages/${member.id}`)}>
        <MessageCircle className="w-3.5 h-3.5" /> {t('connections.connect.message')}
      </Button>
    );
  }
  if (state === RELATIONSHIP_STATES.REQUEST_SENT) {
    return (
      <Button size={size} variant="outline" disabled className={base}>
        <Clock className="w-3.5 h-3.5" /> {t('connections.connect.request_sent')}
      </Button>
    );
  }
  if (state === RELATIONSHIP_STATES.REQUEST_RECEIVED) {
    return (
      <Button size={size} variant="default" className={base} onClick={() => navigate('/notifications')}>
        <UserPlus className="w-3.5 h-3.5" /> {t('connections.connect.respond')}
      </Button>
    );
  }

  if (optimisticSent) {
    return (
      <Button size={size} variant="outline" disabled className={base}>
        <Clock className="w-3.5 h-3.5" /> {t('connections.connect.request_sent')}
      </Button>
    );
  }

  const perm = check(FEATURES.CONNECTION_REQUEST);
  const limitReached = !isPremium && !perm.allowed && perm.reason === 'limit_reached';

  if (!member?.id) {
    return (
      <Button size={size} variant={variant} disabled className={base}>
        <UserPlus className="w-3.5 h-3.5" /> {t('connections.connect.connect')}
      </Button>
    );
  }

  if (limitReached) {
    return (
      <Button
        size={size}
        variant="default"
        className={base}
        onClick={() => {
          haptic('selection');
          trackMembershipEvent(MEMBERSHIP_EVENTS.LIMIT_REACHED, { feature: 'connection_request', used: perm.used, limit: perm.limit });
          showUpgrade('connection_request');
        }}
      >
        <Lock className="w-3.5 h-3.5" /> {t('connections.connect.upgrade')}
      </Button>
    );
  }

  const handleConnect = async () => {
    if (sending) return;
    setSending(true);
    setOptimisticSent(true); // Optimistic: immediately show "Request Sent"
    haptic('light');
    try {
      const req = await sendRequest({
        user,
        receiver: { id: member.id, name: member.name, avatar: member.avatar },
        mutualInterests: member.sharedInterests,
      });
      await recordUsage('connection_request');
      if (req) {
        haptic('success');
        toast({ title: t('connections.connect.toast_sent_title'), description: t('connections.connect.toast_sent_desc', { name: member.name }) });
      } else {
        setOptimisticSent(false); // Roll back
        haptic('error');
        toast({ title: t('connections.connect.toast_failed_title'), description: t('connections.connect.toast_failed_desc') });
      }
    } catch (error) {
      setOptimisticSent(false); // Roll back on error
      haptic('error');
      toast({ title: t('connections.connect.toast_failed_title'), description: t('connections.connect.toast_failed_desc') });
    } finally {
      setSending(false);
    }
  };

  return (
    <Button size={size} variant={variant} disabled={sending} onClick={handleConnect} className={base}>
      {sending ? t('connections.connect.sending') : (<><UserPlus className="w-3.5 h-3.5" /> {t('connections.connect.connect')}</>)}
    </Button>
  );
}