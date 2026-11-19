import MemberIndicators from '@/components/profile/MemberIndicators';
import ProfileUpgradeScreen from '@/components/profile/ProfileUpgradeScreen';
import { IncomingRequestGate } from '@/components/membership/ExplorerPolicyGate';
import React from 'react';
import { useMemberProfile } from '@/lib/member-profile-view';
import { useMembershipAccess } from '@/components/membership/MembershipProvider';
import ProfileAvatar from '@/components/profile/ProfileAvatar';
import { memberSubtitle } from '@/lib/member-display';
import { categoryLabel } from '@/lib/i18n/label-resolvers';
import { useLocalization } from '@/lib/i18n/useLocalization';

/** Request identity comes from the recipient feed; summary comes from the gated profile RPC. */
function ConnectionRequestPreviewBody({ notification, onAction }) {
  const { showUpgrade, isPremium } = useMembershipAccess();
  const { data, isLoading, refetch } = useMemberProfile({ userId: notification._actorId });
  const { t } = useLocalization();
  const deleted = notification._actor?.deleted === true;
  const profile = data?.tier === 'full' && !data?.blocked ? data.profile : null;
  const eligible = !!profile;
  const name = deleted ? 'Deleted account' : (notification._actor?.display_name || '').trim() || 'Member';
  const subtitle = memberSubtitle(profile);
  const canOpen = eligible && !!profile && !!notification._actorId && !deleted && notification._targetAvailable !== false;

  if (data?.tier === 'upgrade' || data?.tier === 'teaser') return <ProfileUpgradeScreen />;
  if (deleted) return <p className="mt-2 text-sm text-muted-foreground">Deleted account</p>;

  return (
    <div className="mt-3">
      <div className="flex items-center gap-3 mb-3">
        <ProfileAvatar src={notification._actor?.photo_url} alt={name} initials={name.charAt(0)} className="h-12 w-12" />
        <p className="font-semibold text-sm">{name}</p>
      </div>
      <div data-testid="requester-preview" aria-hidden={!eligible || undefined}
        className={`rounded-xl border border-border/50 p-3 ${eligible ? '' : 'blur-md pointer-events-none select-none'}`}>
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            {canOpen && <MemberIndicators memberId={notification._actorId} />}
            {eligible && subtitle.label && <p className="text-xs text-muted-foreground">{subtitle.label}</p>}
            {eligible && profile?.show_age === true && profile.age != null && <p className="text-xs text-muted-foreground">{profile.age} years old</p>}
          </div>
        </div>
        {profile?.bio && <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{profile.bio}</p>}
        {Array.isArray(profile?.interests) && <div className="mt-2 flex flex-wrap gap-1">{profile.interests.slice(0,4).map(interest => <span key={interest} className="rounded-full bg-primary/10 px-2 py-1 text-xs">{categoryLabel(t, interest)}</span>)}</div>}
        {!eligible && <div className="mt-3 h-8 rounded bg-muted" />}
      </div>
      {onAction && (canOpen ? (
        <button type="button" onClick={() => onAction('open_requester', notification)} className="mt-3 min-h-11 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Open</button>
      ) : data?.tier === 'teaser' ? (
        <button type="button" onClick={() => showUpgrade('view_profile', { serverTier: 'teaser' })} className="mt-3 min-h-11 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">{isPremium ? 'Manage Membership' : 'Upgrade'}</button>
      ) : <div role="status" className="mt-3 text-sm text-muted-foreground"><p>{isLoading ? 'Checking requester profile…' : 'Requester profile could not be loaded.'}</p><button type="button" onClick={() => refetch()} className="mt-1 min-h-11 px-3 text-primary">Retry profile</button></div>)}
    </div>
  );
}

export default function ConnectionRequestPreview(props) { return <IncomingRequestGate><ConnectionRequestPreviewBody {...props} /></IncomingRequestGate>; }
