import {getDirectMessageAccess} from '@/api/supabaseClient';
import { MAIN_PASSPORT } from '@/lib/passport/enabled';
import { ExplorerLock } from '@/components/membership/ExplorerPolicyGate';
import { IncomingRequestGate } from '@/components/membership/ExplorerPolicyGate';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Clock, Lock, ShieldBan, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';
import { useConnections, sendRequest, acceptRequest, declineRequest, cancelRequest } from '@/lib/connections-store';
import { useSafety } from '@/lib/safety-store';
import { useMembershipAccess } from '@/components/membership/MembershipProvider';
import { FEATURES } from '@/lib/permission-engine';
import { getRelationship, RELATIONSHIP_STATES } from '@/lib/relationship-state';
import { useToast } from '@/components/ui/use-toast';
import { haptic } from '@/lib/haptics';
import { trackMembershipEvent, MEMBERSHIP_EVENTS } from '@/lib/membership-analytics';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function ConnectButton({ member, size = 'sm', variant = 'default', className = '', fullWidth = true, label }) {
  const { t } = useLocalization();
  const { user } = useAuth();
  const conn = useConnections(user);
  const { isBlocked } = useSafety();
  const { check, showUpgrade, recordUsage, isPremium } = useMembershipAccess();
  const { toast } = useToast();
  const navigate = useNavigate();
  const actionFlight=useRef(false);
  const [sending, setSending] = useState(false);
  const [optimisticSent, setOptimisticSent] = useState(false);
  const [responding, setResponding] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const state = getRelationship(member?.id, {
    connections: conn.connections,
    outgoing: conn.outgoing,
    incoming: conn.incoming,
    isBlocked,
  });

  const [messageAccess,setMessageAccess]=useState(null);
  useEffect(()=>{setOptimisticSent(false);},[user?.id,member?.id]);
  useEffect(()=>{
    let active=true;setMessageAccess(null);
    if(user?.id&&member?.id&&state===RELATIONSHIP_STATES.CONNECTED)void getDirectMessageAccess(String(member.id)).then(value=>{if(active)setMessageAccess(value);}).catch(()=>{if(active)setMessageAccess({can_message:false});});
    return()=>{active=false;};
  },[user?.id,member?.id,state]);

  const base = 'flex items-center justify-center gap-1.5 ' + (fullWidth ? 'flex-1 ' : '') + className;

  if(!user?.id || conn.loading || conn.error)return <Button size={size} variant="outline" disabled className={base}>{!user?.id?'Sign in to connect':conn.error?'Connections unavailable':'Checking connection…'}</Button>;

  if (state === RELATIONSHIP_STATES.BLOCKED) {
    return (
      <Button size={size} variant="secondary" disabled className={base}>
        <ShieldBan className="w-3.5 h-3.5" /> {t('connections.connect.blocked')}
      </Button>
    );
  }
  if (state === RELATIONSHIP_STATES.CONNECTED) {
    return (
      <Button size={size} variant="secondary" className={base} disabled={messageAccess?.can_message!==true} onClick={() => {if(messageAccess?.can_message===true)navigate(`/messages/${member.id}`);}}>
        <MessageCircle className="w-3.5 h-3.5" /> {messageAccess===null?'Checking messaging…':messageAccess.can_message?'Message':'Messaging unavailable'}
      </Button>
    );
  }
  if (state === RELATIONSHIP_STATES.REQUEST_SENT) {
    const pending = conn.outgoing.find((request) => String(request.receiver_user_id || request.receiver_id) === String(member?.id) && request.status === 'pending');
    return (
      <div className={base + ' gap-2'} data-testid="outgoing-request-actions">
        <Button size={size} variant="outline" disabled><Clock className="w-3.5 h-3.5" /> Requested</Button>
        <Button size={size} variant="ghost" disabled={cancelling || !pending} onClick={async () => {
          if (!pending || cancelling || actionFlight.current) return;
          actionFlight.current=true;setCancelling(true);
          try { await cancelRequest(pending, user); setOptimisticSent(false); toast({ title: 'Request cancelled' }); }
          catch (error) { toast({ title: 'Could not cancel request', description: error?.message || 'Refresh and try again.', variant: 'destructive' }); }
          finally { actionFlight.current=false;setCancelling(false); }
        }}>{cancelling ? 'Cancelling…' : 'Cancel Request'}</Button>
      </div>
    );
  }
  if (state === RELATIONSHIP_STATES.REQUEST_RECEIVED) {
    const pending = conn.incoming.find((request) => String(request.sender_user_id || request.sender_id) === String(member?.id) && request.status === 'pending');
    return (
      <IncomingRequestGate compact><div className={`${base} gap-2`} data-testid="incoming-request-actions">
        <Button size={size} disabled={responding || !pending} onClick={async () => {
          if (!pending || responding || actionFlight.current) return;
          actionFlight.current=true;setResponding(true);
          try { await acceptRequest(pending, user); toast({ title: 'Connection accepted' }); }
          catch (error) { toast({ title: 'Could not accept request', description: error?.message || 'Refresh the profile and try again.', variant: 'destructive' }); }
          finally { actionFlight.current=false;setResponding(false); }
        }}>Accept</Button>
        <Button size={size} variant="outline" disabled={responding || !pending} onClick={async () => {
          if (!pending || responding || actionFlight.current) return;
          actionFlight.current=true;setResponding(true);
          try { await declineRequest(pending); toast({ title: 'Request declined' }); }
          catch (error) { toast({ title: 'Could not decline request', description: error?.message || 'Refresh the profile and try again.', variant: 'destructive' }); }
          finally { actionFlight.current=false;setResponding(false); }
        }}>Decline</Button>
      </div></IncomingRequestGate>
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

  if (limitReached && MAIN_PASSPORT) return <ExplorerLock/>;

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
    if (sending || actionFlight.current) return;
    actionFlight.current=true;setSending(true);
    haptic('light');
    try {
      const result = await sendRequest({
        user,
        receiver: { id: member.id, name: member.name, avatar: member.avatar },
        mutualInterests: member.sharedInterests,
      });
      if (result?.request) {
        setOptimisticSent(true);
        await recordUsage('connection_request');
        haptic('success');
        toast({ title: t('connections.connect.toast_sent_title'), description: t('connections.connect.toast_sent_desc', { name: member.name }) });
      } else {
        setOptimisticSent(false); // Roll back
        haptic('error');
        toast({ title: t('connections.connect.toast_failed_title'), description: result?.error || t('connections.connect.toast_failed_desc') });
      }
    } catch (error) {
      setOptimisticSent(false); // Roll back on error
      haptic('error');
      toast({ title: t('connections.connect.toast_failed_title'), description: error?.message || t('connections.connect.toast_failed_desc') });
    } finally {
      actionFlight.current=false;setSending(false);
    }
  };

  return (
    <Button size={size} variant={variant} disabled={sending} onClick={handleConnect} className={base}>
      {sending ? t('connections.connect.sending') : (<><UserPlus className="w-3.5 h-3.5" /> {label || t('connections.connect.connect')}</>)}
    </Button>
  );
}
