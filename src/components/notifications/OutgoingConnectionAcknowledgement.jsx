import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { useMembershipAccess } from '@/components/membership/MembershipProvider';
import { resolveOutgoingRecipient } from '@/lib/outgoing-request-recipient';
import ProfileAvatar from '@/components/profile/ProfileAvatar';

export default function OutgoingConnectionAcknowledgement({ notification, onAction }) {
  const { user } = useAuth();
  const { entitlementState } = useMembershipAccess();
  const { data: recipient } = useQuery({
    queryKey: ['outgoingRequestRecipient', user?.id, notification._entityId, entitlementState],
    queryFn: () => resolveOutgoingRecipient(notification._entityId, user.id),
    enabled: !!user?.id && !!notification._entityId,
    retry: false,
    staleTime: 30_000,
  });
  return (
    <div className="mt-3 space-y-3" data-testid="outgoing-request-acknowledgement">
      {recipient?.name && <div className="flex items-center gap-3">
        <ProfileAvatar src={recipient.avatar} alt={recipient.name} initials={recipient.name.charAt(0)} className="h-12 w-12" />
        <p className="text-sm">Your connection request was sent to <strong>{recipient.name}</strong>.</p>
      </div>}
      {onAction && recipient?.path && <button type="button" className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
        onClick={() => onAction('open_outgoing_request', { ...notification, _recipientPath: recipient.path })}>Open</button>}
    </div>
  );
}
