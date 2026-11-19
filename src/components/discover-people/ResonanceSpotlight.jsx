import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Sparkles } from 'lucide-react';
import ProfileAvatar from '@/components/profile/ProfileAvatar';
import MemberIndicators from '@/components/profile/MemberIndicators';
import ConnectButton from '@/components/connections/ConnectButton';
import { resolveMemberPhoto } from '@/lib/member-photo';
import { sharedResonance } from '@/lib/resonance-discovery';

export default function ResonanceSpotlight({ member, viewer, actionLabel = 'Suggest a moment', onNext, variant = 'hero' }) {
 const resonance = sharedResonance(member, viewer);
 const compact = variant === 'sheet';
 return <article aria-label="Your strongest resonance" className={`overflow-hidden rounded-3xl border border-primary/20 bg-card shadow-[0_16px_38px_hsl(var(--primary)/.12)] ${compact?'p-3':'p-4 sm:p-5'}`}>
    <Link to={`/pal/${encodeURIComponent(member.id)}`} className="group block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
      <div className={`relative overflow-hidden rounded-2xl bg-primary/10 ${compact?'h-40 sm:h-48':'h-64 sm:h-80'}`}>
        <ProfileAvatar src={resolveMemberPhoto(member)} alt={member.name} initials={member.name?.slice(0, 1) || 'M'} className="h-full w-full object-cover transition duration-300 motion-safe:group-hover:scale-[1.02]" fallbackClassName="h-full rounded-2xl bg-primary/10 text-primary" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent px-4 pb-4 pt-12 text-white"><h2 className="text-2xl font-semibold">{member.name}{member.age != null ? `, ${member.age}` : ''}</h2><MemberIndicators memberId={member.id} className="mt-1 text-white/90" /></div>
      </div>
      {member.bio && <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{member.bio}</p>}
    </Link>
    {resonance.reasons.length > 0 && <div className="mt-3 rounded-2xl bg-primary/5 p-3 text-sm leading-relaxed"><Sparkles className="mr-2 inline h-4 w-4 text-primary" />{resonance.reasons[0]}</div>}
    {resonance.sharedInterests.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{resonance.sharedInterests.slice(0, 4).map(tag => <span key={tag} className="rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs">{tag}</span>)}</div>}
    <div className="mt-4 flex gap-2">
      <ConnectButton member={{...member, sharedInterests:resonance.sharedInterests}} label={actionLabel} className="min-h-11" />
      {onNext && <button type="button" onClick={onNext} className="min-h-11 rounded-xl border px-3 text-sm font-medium" aria-label="Show another person"><ChevronRight className="h-5 w-5" /></button>}
    </div>
  </article>;
}
