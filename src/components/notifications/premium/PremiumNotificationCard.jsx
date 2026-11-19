import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bell, Lock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useExplorerPolicy, isIncomingRequest, EXPLORER_MESSAGES } from '@/lib/explorer-policy';
import { useMemberProfile } from '@/lib/member-profile-view';
import { useAuth } from '@/lib/AuthContext';
import { useMembershipAccess } from '@/components/membership/MembershipProvider';
import { resolveOutgoingRecipient } from '@/lib/outgoing-request-recipient';
import ProfileAvatar from '@/components/profile/ProfileAvatar';

const actionClass = 'relative isolate inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center whitespace-nowrap rounded-full px-3 text-xs font-semibold text-white before:absolute before:inset-x-0 before:inset-y-2 before:-z-10 before:rounded-full before:bg-violet-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700';
function Action({ children, onClick }) { return <button type="button" className={actionClass} onClick={onClick}>{children}</button>; }

// One frame for every notification, including privacy/loading/error states.
// 112px phone / 120px wide at the default font size; rem units scale with text.
// One bounded message line, and a bottom row with 44px targets around small pills.
export function NotificationCardFrame({ notification, title, body, avatar, avatarName, icon: Icon = Bell, actions, onAction, selectMode, selected, onToggleSelect, locked = false }) {
  const [swipeOpen, setSwipeOpen] = useState(false);
  const hasAvatar = Boolean(avatar || avatarName);
  const gesture = useRef(null);
  const suppressClick = useRef(false);
  const renewal = notification._type === 'subscription_expiring' && !locked;
  const canSwipe = !selectMode && !!onAction && !notification._groupRequest;
  const reveal = renewal ? '84%' : '28%';
  const swipeClass = 'min-h-11 min-w-11 flex flex-1 items-center justify-center px-2 text-center text-xs font-semibold leading-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-white';
  const close = () => setSwipeOpen(false);
  return <div className="relative w-full overflow-hidden rounded-2xl" onKeyDown={event => { if(event.key === 'Escape') close(); }}>
    {canSwipe && <div data-testid="notification-swipe-actions" className="absolute end-0 inset-y-0 flex" style={{width:reveal}} aria-hidden={!swipeOpen}>
      {renewal && <>
        <Link tabIndex={swipeOpen ? 0 : -1} onClick={close} to="/membership?intent=renew" className={swipeClass + ' bg-sky-200 text-slate-950'}>Renew</Link>
        <Link tabIndex={swipeOpen ? 0 : -1} onClick={close} to="/membership" className={swipeClass + ' bg-blue-700 text-white'}>Manage Membership</Link>
      </>}
      <button type="button" tabIndex={swipeOpen ? 0 : -1} onClick={() => { close(); onAction('delete', notification); }} className={swipeClass + ' bg-red-700 text-white'}>Dismiss</button>
    </div>}
    <motion.div initial={false} style={{touchAction:'pan-y'}}
      onPointerDown={event => {
        suppressClick.current=false;
        if (!canSwipe || event.target.closest('button,a,[data-testid="notification-actions"]')) return;
        gesture.current={x:event.clientX,y:event.clientY};
        event.currentTarget.setPointerCapture?.(event.pointerId);
      }}
      onPointerUp={event => {
        const start=gesture.current; gesture.current=null;
        if(!start)return;
        const dx=event.clientX-start.x,dy=event.clientY-start.y;
        if(Math.abs(dx)>35 && Math.abs(dx)>Math.abs(dy)*1.5){setSwipeOpen(dx<0);suppressClick.current=true;}
      }}
      onPointerCancel={() => {gesture.current=null;}}
      onClickCapture={event => {if(suppressClick.current){event.preventDefault();event.stopPropagation();suppressClick.current=false;}}}
      animate={{ x: canSwipe && swipeOpen ? '-' + reveal : 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
      <article data-testid="notification-card" data-locked={locked || undefined} data-unread={!notification.read}
        className={`relative w-full h-28 sm:h-[7.5rem] grid grid-cols-[3rem_minmax(0,1fr)] sm:grid-cols-[3.25rem_minmax(0,1fr)] grid-rows-[minmax(0,1fr)_2.75rem] gap-x-3 gap-y-1 p-2 sm:p-2.5 rounded-2xl border bg-white text-slate-900 shadow-[0_2px_8px_rgba(109,40,217,0.05)] ${selected ? 'ring-2 ring-violet-600 border-violet-300' : 'border-violet-100'}`}>
        <div data-testid="notification-visual" className={`relative self-center justify-self-center ${hasAvatar ? 'h-12 w-12 sm:h-[52px] sm:w-[52px]' : 'h-11 w-11'}`}>
          {hasAvatar ? <ProfileAvatar src={avatar} alt={avatarName || ''} initials={(avatarName || 'M').charAt(0)} className="h-12 w-12 sm:h-[52px] sm:w-[52px] !rounded-full border border-white shadow-sm" fallbackClassName="bg-violet-50 text-violet-800 !rounded-full" /> :
            <div className="h-11 w-11 rounded-xl bg-violet-50 text-violet-700 flex items-center justify-center">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>}
          {!notification.read && <span aria-label="Unread" className="absolute top-0 end-0 h-2.5 w-2.5 rounded-full bg-violet-500 border border-white" />}
        </div>
        <div className="min-w-0 self-center">
          <h3 className="min-w-0 text-sm leading-5 font-semibold line-clamp-1 break-words [overflow-wrap:anywhere]">{title}</h3>
          <div data-testid="notification-body" className="mt-0.5 min-w-0 overflow-hidden text-[13px] leading-[18px] text-slate-600">
            <div className="line-clamp-1 break-words [overflow-wrap:anywhere]">{body}</div>
          </div>
        </div>
        <div className="col-span-2 flex min-w-0 items-center justify-between gap-2">
          <p data-testid="notification-timestamp" className="min-w-0 flex-1 truncate text-[11px] leading-4 text-slate-600">{notification.timestamp}</p>
          <div data-testid="notification-actions" className="flex min-w-0 max-w-[75%] items-center gap-2 overflow-x-auto overscroll-x-contain">
            {canSwipe && <button type="button" aria-label="Notification actions" aria-expanded={swipeOpen} className="min-h-11 min-w-11 px-2 text-xs font-semibold text-slate-700" onClick={() => setSwipeOpen(open => !open)}>Actions</button>}
            {selectMode ? <button type="button" aria-pressed={!!selected} aria-label={selected ? 'Deselect notification' : 'Select notification'} className={actionClass} onClick={() => onToggleSelect?.(notification.id)}>{selected ? 'Selected' : 'Select'}</button> : actions}
          </div>
        </div>
      </article>
    </motion.div>
  </div>;
}

function LockedCard(props) {
  // Do not pass raw identity, title, image or destination into the frame.
  const { id, read, timestamp } = props.notification;
  return <NotificationCardFrame {...props} notification={{ id, read, timestamp, _locked: true }} locked
    title="Request received" body={EXPLORER_MESSAGES.incoming} icon={Lock}
    actions={<Link to="/upgrade" aria-label="Request received — Upgrade" className={actionClass}>Upgrade</Link>} />;
}
function IncomingCard(props) {
  const policy = useExplorerPolicy();
  if (!policy.data) return <NotificationCardFrame {...props} notification={{ id: props.notification.id, read: props.notification.read, timestamp: props.notification.timestamp }}
    title="Request received" icon={Lock} body={policy.isError ? 'Request access could not be verified. Please retry.' : 'Checking request access…'}
    actions={policy.isError && <Action onClick={() => policy.refetch()}>Retry</Action>} />;
  if (!policy.data.premium) return <LockedCard {...props} />;
  return props.notification._type === 'connection_request' ? <ConnectionCard {...props} /> : <GenericCard {...props} />;
}
function ConnectionCard(props) {
  const { notification: n, onAction } = props;
  const { data, isLoading, refetch } = useMemberProfile({ userId: n._actorId });
  const deleted = n._actor?.deleted === true;
  const name = deleted ? 'Deleted account' : (n._actor?.display_name || '').trim() || 'Member';
  const profile = data?.tier === 'full' && !data.blocked ? data.profile : null;
  const upgrade = ['upgrade', 'teaser'].includes(data?.tier);
  const canOpen = profile && n._actorId && !deleted && n._targetAvailable !== false;
  const status = isLoading ? 'Checking requester profile…' : 'Requester profile could not be loaded.';
  return <NotificationCardFrame {...props} title={n.title} avatar={!deleted ? n._actor?.photo_url : null} avatarName={name}
    body={<span data-testid="requester-preview"><strong className="text-slate-900">{name}</strong>{' '}
      {profile ? 'requested to connect with you.' : !deleted && <span>{upgrade ? 'Profile viewing is included with Premium.' : status}</span>}
    </span>}
    actions={canOpen ? <Action onClick={() => onAction?.('open_requester', n)}>Open</Action> : !deleted && (upgrade ? <Link to="/upgrade" className={actionClass}>Upgrade</Link> : <Action onClick={() => refetch()}>Retry profile</Action>)} />;
}
function OutgoingCard(props) {
  const { notification: n, onAction } = props;
  const { user } = useAuth();
  const { entitlementState } = useMembershipAccess();
  const { data: recipient } = useQuery({
    queryKey: ['outgoingRequestRecipient', user?.id, n._entityId, entitlementState],
    queryFn: () => resolveOutgoingRecipient(n._entityId, user.id),
    enabled: !!user?.id && !!n._entityId, retry: false, staleTime: 30_000,
  });
  return <NotificationCardFrame {...props} title={n.title} avatar={recipient?.avatar} avatarName={recipient?.name}
    body={<div data-testid="outgoing-request-acknowledgement">{recipient?.name ? <>Your connection request was sent to <strong>{recipient.name}</strong>.</> : 'Your connection request was sent.'}</div>}
    actions={recipient?.path && <Action onClick={() => onAction?.('open_outgoing_request', { ...n, _recipientPath: recipient.path })}>Open</Action>} />;
}
function GenericCard(props) {
  const { notification: n, onAction } = props;
  const actions = n._type === 'subscription_expiring' ? null :
    n.actions?.map(action => <Action key={action.action || action.label} onClick={() => onAction?.(action.action, n)}>{action.label}</Action>);
  const profileRelated = n._type === 'profile_view' || n._type?.startsWith('connection_');
  return <NotificationCardFrame {...props} title={n.title} body={n.description}
    avatar={profileRelated && !n._actor?.deleted ? n.thumbnail || n._actor?.photo_url : undefined}
    avatarName={profileRelated ? n._actor?.display_name : undefined}
    icon={n.icon || Bell} actions={actions} />;
}
export default function PremiumNotificationCard(props) {
  if (props.notification._locked) return <LockedCard {...props} />;
  if (isIncomingRequest(props.notification._type)) return <IncomingCard {...props} />;
  if (props.notification._type === 'connection_request_sent') return <OutgoingCard {...props} />;
  return <GenericCard {...props} />;
}
