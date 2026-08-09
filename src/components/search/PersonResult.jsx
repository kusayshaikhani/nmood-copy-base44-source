import React from 'react';
import ProfileAvatar from '@/components/profile/ProfileAvatar';
import { resolveMemberPhoto } from '@/lib/member-photo';
import { trackProductEvent, PRODUCT_EVENTS } from '@/lib/product-analytics';
import ConnectButton from '@/components/connections/ConnectButton';
import VerifiedBadge from '@/components/shared/VerifiedBadge';

export default function PersonResult({ person }) {
  const initials = person.name.split(' ').map((n) => n[0]).join('').toUpperCase();
  return (
    <div onClick={() => trackProductEvent(PRODUCT_EVENTS.SEARCH_RESULT_SELECTED, { resultType: 'person' })} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:shadow-md transition-default cursor-pointer">
      <ProfileAvatar
        src={resolveMemberPhoto(person)}
        alt={person.name}
        initials={initials}
        className="w-14 h-14 flex-shrink-0"
        fallbackClassName="bg-gradient-to-br from-primary to-accent text-white text-sm font-bold"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm font-semibold truncate">{person.name}</h3>
          {person.verified && <VerifiedBadge />}
        </div>
        <p className="text-xs text-muted-foreground truncate">{person.languages.join(' · ')}</p>
        <div className="flex flex-wrap gap-1 mt-1">
          {person.interests.slice(0, 3).map((i) => (
            <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{i}</span>
          ))}
        </div>
      </div>
      <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0">
        <ConnectButton member={{ id: person.id, name: person.name, avatar: person.avatar, sharedInterests: person.interests }} size="sm" fullWidth={false} />
      </div>
    </div>
  );
}