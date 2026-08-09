import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Clock, Calendar, Check, UserCircle2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocalization } from '@/lib/i18n/useLocalization';
import NmoodStatusBadge from '@/components/nmoods/NmoodStatusBadge';
import NmoodCountdown from '@/components/nmoods/NmoodCountdown';
import { computeNmoodStatus } from '@/lib/nmood-lifecycle';

/**
 * NmoodCard — a single intention/activity card in the Nmoods feed.
 * The ACTIVITY always dominates the visual hierarchy. The member is
 * intentionally small (15-20% of card) so users read the plan first.
 */
export default function NmoodCard({ post, index = 0 }) {
  const navigate = useNavigate();
  const { t } = useLocalization();
  const [interested, setInterested] = useState(false);
  const [count, setCount] = useState(post.interested_count || 0);
  const status = computeNmoodStatus(post);

  const toggleInterested = () => {
    if (interested) {
      setCount((c) => c - 1);
      setInterested(false);
    } else {
      setCount((c) => c + 1);
      setInterested(true);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1], delay: Math.min(index * 0.06, 0.36) }}
      onClick={() => navigate(`/nmood/${post.id}`)}
      className="relative rounded-2xl border border-white/20 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-xl p-5 shadow-card hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-300 overflow-hidden cursor-pointer"
    >
      {/* Subtle gradient accent */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />

      {/* 1. Category icon + label */}
      <div className="relative flex items-center gap-2 mb-3">
        <span className="text-lg leading-none">{post.category_icon}</span>
        <span className="text-xs font-medium text-muted-foreground">{post.category}</span>
        <span className="ml-auto">
          <NmoodStatusBadge status={status} />
        </span>
      </div>

      {/* 2. Heading + 3. Plan title — the dominant element */}
      <p className="relative text-[11px] font-medium text-muted-foreground/80 mb-0.5">
        {t('nmoods.im_nmood_for')}
      </p>
      <h3 className="relative text-lg font-bold leading-snug text-foreground mb-3">
        {post.intention_text}
      </h3>

      {/* Looking for — small contextual label */}
      {post.looking_for && (
        <div className="relative flex items-center gap-1.5 mb-3">
          <Users className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="text-xs text-muted-foreground">{t('nmoods.looking_for')}:</span>
          <span className="text-xs font-medium text-foreground">{post.looking_for}</span>
        </div>
      )}

      {/* 4. Plan metadata */}
      <div className="relative flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-muted-foreground mb-3">
        <span className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 shrink-0" /> {post.date}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 shrink-0" /> {post.time}
        </span>
        <span className="flex items-center gap-1 truncate">
          <MapPin className="w-3.5 h-3.5 shrink-0" /> {post.distance} · {post.location}
        </span>
      </div>

      {/* Real-time countdown */}
      <NmoodCountdown post={post} />

      {/* 5. Divider */}
      <div className="relative border-t border-border/40 mb-3" />

      {/* 6. Small member preview — intentionally compact */}
      <div className="relative flex items-center gap-2.5 mb-3">
        <img
          src={post.member_avatar}
          alt={post.member_first_name}
          loading="lazy"
          decoding="async"
          className="w-9 h-9 rounded-full object-cover ring-1 ring-border/50 shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium truncate">{post.member_first_name}</span>
            <span className="text-xs text-muted-foreground">{post.member_age}</span>
            {post.verified && (
              <span className="flex items-center justify-center w-4 h-4 rounded-full bg-primary/15">
                <Check className="w-2.5 h-2.5 text-primary" strokeWidth={3} />
              </span>
            )}
          </div>
          <span className="text-[11px] text-muted-foreground">
            {t('nmoods.away', { distance: post.distance })}
          </span>
        </div>
        <span className="text-[11px] text-muted-foreground shrink-0">
          {count} {t('nmoods.interested_short')}
        </span>
      </div>

      {/* 7. Shared interests — up to 4 chips */}
      <div className="relative flex flex-wrap gap-1.5 mb-4">
        {(post.member_interests || []).slice(0, 4).map((interest) => (
          <span
            key={interest}
            className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-secondary/80 text-secondary-foreground"
          >
            {interest}
          </span>
        ))}
      </div>

      {/* 8. Action buttons */}
      <div className="relative flex gap-2">
        <Button
          onClick={(e) => { e.stopPropagation(); toggleInterested(); }}
          variant={interested ? 'default' : 'outline'}
          size="sm"
          className="flex-1"
        >
          {interested ? (
            <>
              <Check className="w-4 h-4" /> {t('nmoods.interested')}
            </>
          ) : (
            t('nmoods.interested')
          )}
        </Button>
        <Button variant="ghost" size="sm" className="flex-1" onClick={(e) => e.stopPropagation()}>
          <UserCircle2 className="w-4 h-4" /> {t('nmoods.view_profile')}
        </Button>
      </div>
    </motion.div>
  );
}