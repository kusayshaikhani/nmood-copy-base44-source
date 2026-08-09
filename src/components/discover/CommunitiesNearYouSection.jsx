import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, ArrowRight, Lock } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import SmartImage from '@/components/shared/SmartImage';
import { getCategoryIcon } from '@/components/communities/category-icons';
import { useLocalization } from '@/lib/i18n/useLocalization';

/**
 * UI-014 — "Active Communities Near You"
 * Premium horizontal-scrolling community cards. Presentation-only redesign;
 * reuses the existing join_type → label/class mapping and the same community
 * object shape. No backend logic, membership state, or data fabrication.
 */

// Same join mapping as CommunityCard — preserved verbatim.
const joinConfig = {
  public: { label: 'Join', gradient: true, icon: null },
  approval: { label: 'Request', gradient: true, icon: null },
  private: { label: 'Private', gradient: false, muted: true, icon: Lock },
  invite: { label: 'Invite Only', gradient: false, muted: true, icon: Lock },
};

function formatMemberCount(n) {
  const num = Number(n) || 0;
  if (num >= 1000) {
    const v = num / 1000;
    return `${v >= 10 ? Math.round(v) : v.toFixed(1)}K`;
  }
  return String(num);
}

function MemberStack({ community }) {
  const { organizer, member_count } = community || {};
  const count = Number(member_count) || 0;
  const extras = Math.max(0, count - 1);

  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2.5">
        <Avatar className="w-7 h-7 border-2 border-card rounded-full">
          <AvatarImage src={organizer?.avatar} alt={organizer?.name} />
          <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
            {organizer?.name?.charAt(0) || 'C'}
          </AvatarFallback>
        </Avatar>
        {extras > 0 && (
          <span className="w-7 h-7 flex items-center justify-center rounded-full border-2 border-card bg-secondary text-secondary-foreground text-[10px] font-semibold">
            +{extras > 99 ? '99+' : extras}
          </span>
        )}
      </div>
      <span className="text-caption font-medium text-muted-foreground">
        {formatMemberCount(count)} Members
      </span>
    </div>
  );
}

function CommunityNearCard({ community, index = 0 }) {
  const navigate = useNavigate();
  const { id, cover_photo, name, category, location, join_type, organizer, description } = community || {};
  const cfg = joinConfig[join_type] || joinConfig.public;
  const JoinIcon = cfg.icon;
  const CatIcon = getCategoryIcon(category);

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.3), duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      className="pressable snap-start shrink-0 w-[240px] h-[320px] rounded-[24px] overflow-hidden border border-border/50 bg-card shadow-card hover:shadow-elevated flex flex-col"
    >
      {/* Cover — ~55% of card */}
      <Link to={`/community/${id}`} className="relative block h-[176px] shrink-0">
        <SmartImage src={cover_photo} alt={name} rounded="rounded-none" className="w-full h-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />

        {/* Category badge — upper-left */}
        <span className="absolute top-3 start-3 flex items-center gap-1.5 ps-2 pe-3 py-1.5 rounded-full bg-white/25 backdrop-blur-md border border-white/30 text-white text-[11px] font-semibold">
          <CatIcon className="w-3.5 h-3.5" strokeWidth={2.2} />
          {category}
        </span>

        {/* Non-public indicator — upper-right */}
        {join_type !== 'public' && JoinIcon && (
          <span className="absolute top-3 end-3 w-7 h-7 flex items-center justify-center rounded-full bg-white/25 backdrop-blur-md border border-white/30">
            <JoinIcon className="w-3.5 h-3.5 text-white" />
          </span>
        )}
      </Link>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5 gap-2.5">
        <Link to={`/community/${id}`}>
          <h3 className="text-base font-bold leading-tight tracking-tight line-clamp-1 text-balance">
            {name}
          </h3>
        </Link>

        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
          {description}
        </p>

        {location && (
          <span className="flex items-center gap-1.5 text-caption text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 text-primary" />
            <span className="truncate">{location}</span>
          </span>
        )}

        <div className="mt-auto">
          <MemberStack community={community} />

          <button
            type="button"
            onClick={() => navigate(`/community/${id}`)}
            className={`mt-3 flex items-center justify-center gap-1.5 w-full h-11 rounded-button text-sm font-semibold transition-all ${
              cfg.gradient
                ? 'bg-nmood-cta text-primary-foreground shadow-card hover:shadow-elevated'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/70'
            }`}
          >
            {JoinIcon && <JoinIcon className="w-4 h-4" />}
            {cfg.label}
          </button>
        </div>
      </div>
    </motion.article>
  );
}

export default function CommunitiesNearYouSection({ communities }) {
  const { t } = useLocalization();

  return (
    <section>
      {/* Section header */}
      <div className="flex items-end justify-between gap-4 mb-5">
        <div className="space-y-1">
          <h2 className="text-section-title text-foreground">
            {t('discovery.section.active_communities')}
          </h2>
          <p className="text-body text-muted-foreground">
            {t('discovery.section.active_communities_desc')}
          </p>
        </div>
        <Link
          to="/communities"
          className="flex items-center gap-1 text-sm font-semibold text-primary shrink-0 hover:gap-1.5 transition-all pb-1"
        >
          {t('common.see_all')}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {communities.length > 0 ? (
        <div className="flex gap-5 overflow-x-auto no-scrollbar snap-x snap-mandatory momentum-scroll -mx-4 px-4 sm:mx-0 sm:px-0 pb-2">
          {communities.map((c, i) => (
            <CommunityNearCard key={c.id} community={c} index={i} />
          ))}
        </div>
      ) : (
        <div className="p-7 rounded-card border border-dashed border-border/60 text-center bg-card">
          <p className="text-sm font-semibold">{t('discovery.empty.active_communities.title')}</p>
          <p className="text-caption mt-1">{t('discovery.empty.active_communities.desc')}</p>
        </div>
      )}
    </section>
  );
}