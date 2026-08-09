import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Lock, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import SmartImage from '@/components/shared/SmartImage';
import { getCategoryIcon } from './category-icons';

/**
 * UI-006 — Premium community/circle card.
 * Large cover image, glass category icon badge, modern typography,
 * member + organizer rows, and a soft entrance animation.
 * All join-type / link logic preserved.
 */
const joinConfig = {
  public: { label: 'Join', class: 'bg-success text-success-foreground hover:bg-success/90', icon: null },
  approval: { label: 'Request', class: 'bg-primary text-primary-foreground hover:bg-primary/90', icon: null },
  private: { label: 'Private', class: 'bg-muted text-muted-foreground', icon: Lock },
  invite: { label: 'Invite Only', class: 'bg-muted text-muted-foreground pointer-events-none', icon: Lock },
};

export default function CommunityCard({ community, index = 0 }) {
  const { id, cover_photo, name, category, location, member_count, join_type, organizer, description } = community || {};
  const cfg = joinConfig[join_type] || joinConfig.public;
  const JoinIcon = cfg.icon;
  const CatIcon = getCategoryIcon(category);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35, ease: 'easeOut' }}
      className="w-full rounded-card overflow-hidden border border-border/40 bg-card shadow-card hover-lift"
    >
      <Link to={`/community/${id}`} className="block relative h-44">
        <SmartImage src={cover_photo} alt={name} rounded="rounded-none" className="w-full h-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

        {/* Premium category icon badge */}
        <span className="absolute top-3 start-3 flex items-center gap-1.5 ps-2 pe-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-[11px] font-medium">
          <CatIcon className="w-3.5 h-3.5" strokeWidth={2.2} />
          {category}
        </span>

        {/* Join-type badge */}
        {join_type !== 'public' && JoinIcon && (
          <span className="absolute top-3 end-3 w-7 h-7 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-md border border-white/30">
            <JoinIcon className="w-3.5 h-3.5 text-white" />
          </span>
        )}

        {/* Modern typography title */}
        <h3 className="absolute bottom-3 start-4 end-4 text-white font-heading font-bold text-lg leading-tight line-clamp-2 text-balance">{name}</h3>
      </Link>

      <div className="p-4">
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">{description}</p>

        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-primary" /> {member_count}</span>
          {location && <span className="flex items-center gap-1.5 truncate"><MapPin className="w-3.5 h-3.5 text-primary" /> {location}</span>}
        </div>

        <div className="flex items-center gap-2 mb-3.5">
          <Avatar className="w-6 h-6 border border-card">
            <AvatarImage src={organizer?.avatar} alt={organizer?.name} />
            <AvatarFallback className="text-[9px] bg-primary/10 text-primary font-semibold">{organizer?.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground truncate">{organizer?.name}</span>
        </div>

        <Link to={`/community/${id}`} className={`flex items-center justify-center gap-1.5 w-full h-10 rounded-button text-xs font-semibold transition-default ${cfg.class}`}>
          {JoinIcon && <JoinIcon className="w-3.5 h-3.5" />}
          {cfg.label}
        </Link>
      </div>
    </motion.div>
  );
}