import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Lock, Sparkles } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import SmartImage from '@/components/shared/SmartImage';

const privacyConfig = {
  public: { label: 'Join', class: 'bg-success text-success-foreground hover:bg-success/90' },
  approval: { label: 'Request', class: 'bg-primary text-primary-foreground hover:bg-primary/90' },
  private: { label: 'Private', class: 'bg-muted text-muted-foreground pointer-events-none' },
  invite: { label: 'Invite Only', class: 'bg-muted text-muted-foreground pointer-events-none' },
};

export default function CircleCard(props) {
  const circle = props.circle || {};
  const circleId = circle.id;
  const cover_photo = circle.cover_photo;
  const name = circle.name;
  const community_name = circle.community_name;
  const privacy = circle.privacy;
  const member_count = circle.member_count;
  const max_members = circle.max_members;
  const shared_interests = circle.shared_interests;
  const host = circle.host || {};
  const cfg = privacyConfig[privacy] || privacyConfig.public;

  return (
    <div className="flex-shrink-0 w-72 rounded-2xl overflow-hidden border border-border bg-card hover-lift">
      <Link to={`/circle/${circleId}`} className="block relative h-28">
        <SmartImage src={cover_photo} alt={name} rounded="rounded-none" className="w-full h-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <h3 className="absolute bottom-2 start-2.5 end-2.5 text-white font-semibold text-sm line-clamp-1">{name}</h3>
      </Link>
      <div className="p-3">
        <div className="flex flex-wrap gap-1 mb-2">
          {(shared_interests || []).slice(0, 2).map((interest) => (
            <span key={interest} className="text-[9px] font-medium bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{interest}</span>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {member_count}/{max_members}</span>
          <span className="flex items-center gap-1 capitalize">
            {privacy === 'private' || privacy === 'invite' ? <Lock className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
            {privacy}
          </span>
        </div>
        <div className="flex items-center gap-1.5 mb-2.5">
          <Avatar className="w-5 h-5">
            <AvatarImage src={host.avatar} alt={host.name} />
            <AvatarFallback className="text-[8px] bg-primary/10 text-primary">{host.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground truncate">{host.name}</span>
        </div>
        <Link to={`/circle/${circleId}`} className={`flex items-center justify-center w-full h-8 rounded-md text-xs font-medium transition-default ${cfg.class}`}>
          {cfg.label}
        </Link>
      </div>
    </div>
  );
}