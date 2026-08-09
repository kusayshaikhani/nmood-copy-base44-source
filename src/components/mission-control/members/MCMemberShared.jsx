import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useLocalization } from '@/lib/i18n/useLocalization';
import {
  fullName, memberShortId, trustScore, verificationStatus, onlineDot,
  membershipTier, STATUS_LABELS, STATUS_BADGE,
} from '@/lib/member-directory';

export function AvatarCell({ member, size = 'w-8 h-8' }) {
  const initials = (fullName(member) || '?').split(' ').map((n) => n[0]).join('').slice(0, 2);
  return (
    <Avatar className={size}>
      {member.photo_url ? <AvatarImage src={member.photo_url} /> : null}
      <AvatarFallback className="bg-muted text-xs">{initials}</AvatarFallback>
    </Avatar>
  );
}

export function StatusBadge({ status }) {
  const s = status || 'active';
  return (
    <Badge
      variant={STATUS_BADGE[s] || 'secondary'}
      className={s === 'suspended' ? 'text-warning' : s === 'deleted' ? 'line-through opacity-60' : ''}
    >
      {STATUS_LABELS[s] || s}
    </Badge>
  );
}

export function MembershipBadge({ member, membershipMap }) {
  const { t } = useLocalization();
  const tier = membershipTier(member, membershipMap);
  return tier === 'premium' ? (
    <Badge className="bg-primary/15 text-primary border border-primary/20 hover:bg-primary/20">{t('mission.premium')}</Badge>
  ) : (
    <Badge variant="secondary">{t('mission.explorer')}</Badge>
  );
}

export function VerificationBadge({ member }) {
  const { t } = useLocalization();
  return verificationStatus(member) === 'verified'
    ? <Badge variant="default">{t('mission.verified')}</Badge>
    : <Badge variant="outline" className="text-muted-foreground">{t('mission.email_only')}</Badge>;
}

export function TrustCell({ member }) {
  const s = trustScore(member);
  const color = s >= 80 ? 'text-success' : s >= 40 ? 'text-warning' : 'text-destructive';
  return <span className={'font-semibold ' + color}>{s}</span>;
}

export function OnlineDot({ member }) {
  const dot = onlineDot(member);
  const color = dot === 'online' ? 'bg-success' : dot === 'recent' ? 'bg-warning' : 'bg-muted-foreground/40';
  const label = dot === 'online' ? 'Approx. online' : dot === 'recent' ? 'Recent' : 'Offline';
  return <span className={'inline-block w-2 h-2 rounded-full ' + color} title={label} aria-label={label} />;
}

export function memberRowLabel(member) {
  return fullName(member);
}

export { memberShortId };