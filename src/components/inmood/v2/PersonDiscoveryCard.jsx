import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bookmark, BadgeCheck, MapPin, CalendarDays, Clock, Heart, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import moment from 'moment';
import { expStartMoment, expTimeLabel } from '@/lib/experience-utils';
import MemberImage from '@/components/shared/MemberImage';

const CATEGORY_EMOJI = {
  AI: '🤖',
  Food: '🍽️',
  Outdoor: '🌿',
  Music: '🎵',
  Coffee: '☕',
  Gaming: '🎮',
  Sports: '⚽',
  Movies: '🎬',
  Learning: '📚',
  Nightlife: '🌙',
  Travel: '✈️',
  Photography: '📸',
};

function activityIcon(exp) {
  const cat = (exp.category || '').toLowerCase();
  const key = Object.keys(CATEGORY_EMOJI).find((k) => cat.includes(k.toLowerCase()));
  return key ? CATEGORY_EMOJI[key] : '✨';
}

function dayLabel(exp) {
  const m = expStartMoment(exp);
  if (!m || !m.isValid()) return exp?.date || '';
  const diff = m.clone().startOf('day').diff(moment().startOf('day'), 'days');
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return m.format('MMM D');
}

function readWishlist() {
  try { return JSON.parse(localStorage.getItem('inmood_wishlist') || '[]'); } catch { return []; }
}

// Portrait pills sit ON the photo, so they share a neutral dark-glass language
// (legible in both light and dark themes). Only the rank dot is color-coded.
const RANK_DOTS = {
  primary: 'bg-primary',
  amber: 'bg-amber-400',
  emerald: 'bg-emerald-400',
  sky: 'bg-sky-400',
  violet: 'bg-accent',
};

export default function PersonDiscoveryCard({ experience, index, rankLabel, rankTone }) {
  const navigate = useNavigate();
  const [interested, setInterested] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [saved, setSaved] = useState(() => readWishlist().includes(String(experience.id)));

  const { host, title, distance, image, verified, venue } = experience;
  const portrait = host?.avatar || image;
  const time = expTimeLabel(experience);
  const location = venue?.name || venue?.address || experience.location || host?.city || '';
  const day = dayLabel(experience);
  const age = host?.age || host?.member_age;
  const chips = [experience.category, ...(experience.tags || []).slice(0, 3)].filter(Boolean).slice(0, 3);
  const icon = activityIcon(experience);
  const rankDot = rankLabel ? (RANK_DOTS[rankTone] || RANK_DOTS.primary) : null;

  const open = () => navigate(`/experience/${experience.id}`);

  const handleInterested = (e) => {
    e.stopPropagation();
    if (!interested) {
      setInterested(true);
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 600);
    }
    open();
  };

  const viewProfile = (e) => {
    e.stopPropagation();
    navigate('/discover-people');
  };

  const toggleSave = (e) => {
    e.stopPropagation();
    const list = readWishlist();
    const idStr = String(experience.id);
    if (list.includes(idStr)) {
      localStorage.setItem('inmood_wishlist', JSON.stringify(list.filter((x) => x !== idStr)));
      setSaved(false);
    } else {
      localStorage.setItem('inmood_wishlist', JSON.stringify([...list, idStr]));
      setSaved(true);
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -60px 0px' }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileTap={{ scale: 0.99 }}
      onClick={open}
      className="group relative flex w-full min-h-[240px] rounded-card overflow-hidden bg-card border border-border/40 shadow-card hover-lift cursor-pointer"
    >
      {/* ═════ LEFT — portrait hero (40%) ═════ */}
      <motion.div
        initial={{ scale: 0.98 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true, margin: '0px 0px -60px 0px' }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-[40%] flex-shrink-0 overflow-hidden"
      >
        <MemberImage
          src={portrait}
          alt={host?.name || 'Member'}
          initial={host?.name}
          className="absolute inset-0 w-full h-full"
          imgClassName="object-[center_22%] group-hover:scale-[1.06]"
        />
        {/* Cinematic gradient — soft top vignette, deeper bottom for badge legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-black/20 pointer-events-none" />
        <div className="absolute inset-0 bg-amber-500/[0.06] mix-blend-soft-light pointer-events-none" />

        {/* Online — top-left */}
        <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5 bg-black/40 backdrop-blur-md rounded-full pl-[7px] pr-2.5 py-[5px] border border-white/10">
          <span className="relative w-2 h-2 rounded-full bg-emerald-400">
            <span className="absolute inset-0 rounded-full bg-emerald-400/60 animate-ping" />
          </span>
          <span className="text-white text-[10px] font-medium tracking-tight">Online</span>
        </div>

        {/* Rank — top-right, intelligent curation label */}
        {rankDot && (
          <div className="absolute top-3.5 right-3.5 inline-flex items-center gap-1 bg-black/40 backdrop-blur-md rounded-full px-2.5 py-[5px] border border-white/10">
            <span className={`w-1.5 h-1.5 rounded-full ${rankDot}`} />
            <span className="text-white text-[10px] font-semibold tracking-tight">{rankLabel}</span>
          </div>
        )}

        {/* Distance — bottom-left */}
        {distance && (
          <div className="absolute bottom-3.5 left-3.5 flex items-center gap-1 bg-black/40 backdrop-blur-md rounded-full px-2.5 py-[5px] border border-white/10">
            <MapPin className="w-[11px] h-[11px] text-white/85" />
            <span className="text-white text-[10px] font-medium tracking-tight">{distance} away</span>
          </div>
        )}
      </motion.div>

      {/* ═════ RIGHT — identity + intent (60%) ═════ */}
      <div className="relative w-[60%] min-w-0 p-5 flex flex-col">
        {/* Bookmark — top right */}
        <motion.button
          type="button"
          onClick={toggleSave}
          whileTap={{ scale: 0.88 }}
          animate={{ scale: saved ? [1, 1.12, 1] : 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          aria-label="Save"
          className="absolute top-3.5 right-3.5 w-10 h-10 rounded-full bg-muted/60 border border-border/40 hover:bg-muted flex items-center justify-center transition-colors duration-200 z-10"
        >
          <Bookmark className={`w-[18px] h-[18px] transition-all duration-300 ${saved ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
        </motion.button>

        {/* Activity icon + eyebrow */}
        <div className="flex items-center gap-2.5 pr-12">
          <span className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-[15px] flex-shrink-0 ring-1 ring-primary/10">
            {icon}
          </span>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground truncate">I'm in the mood for</p>
        </div>

        {/* Activity title */}
        <h3 className="text-[17px] font-semibold leading-[1.3] mt-3 line-clamp-2 pr-12 text-foreground">{title}</h3>

        {/* WHEN · WHERE */}
        <div className="flex items-center gap-3.5 mt-3 text-[11px] text-muted-foreground">
          {day && (
            <span className="flex items-center gap-1 flex-shrink-0">
              <CalendarDays className="w-[13px] h-[13px] text-primary/70" /> {day}
            </span>
          )}
          {time && (
            <span className="flex items-center gap-1 flex-shrink-0">
              <Clock className="w-[13px] h-[13px] text-primary/70" /> {time}
            </span>
          )}
          {location && (
            <span className="flex items-center gap-1 min-w-0">
              <MapPin className="w-[13px] h-[13px] text-primary/70 flex-shrink-0" />
              <span className="truncate">{location}</span>
            </span>
          )}
        </div>

        {/* Soft divider */}
        <div className="h-px bg-border/50 my-4" />

        {/* Mini profile */}
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar className="w-9 h-9 border border-border flex-shrink-0">
            <AvatarImage src={host?.avatar} alt={host?.name} />
            <AvatarFallback className="text-[12px] bg-primary/10 text-primary font-semibold">
              {host?.name?.charAt(0) || '?'}
            </AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[13.5px] font-semibold text-foreground truncate">{host?.name || 'Member'}</span>
            {age && <span className="text-[12px] font-medium text-muted-foreground flex-shrink-0">{age}</span>}
            {verified && <BadgeCheck className="w-4 h-4 text-primary flex-shrink-0" />}
          </div>
        </div>

        {/* Interest chips */}
        {chips.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {chips.map((c, i) => (
              <span
                key={i}
                className="text-[10.5px] px-2.5 py-[3px] rounded-full bg-muted text-muted-foreground border border-border/40 truncate max-w-[96px] font-medium"
              >
                {c}
              </span>
            ))}
          </div>
        )}

        <div className="flex-1" />

        {/* Actions */}
        <div className="flex gap-3 mt-5">
          <motion.button
            type="button"
            onClick={viewProfile}
            whileTap={{ scale: 0.97 }}
            className="flex-1 h-11 rounded-button border border-border bg-card text-foreground text-[13px] font-medium flex items-center justify-center gap-1.5 hover:bg-muted/50 transition-colors"
          >
            <User className="w-[15px] h-[15px] text-muted-foreground" />
            View Profile
          </motion.button>
          <motion.button
            type="button"
            onClick={handleInterested}
            whileTap={{ scale: 0.96 }}
            animate={celebrate ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 h-11 rounded-button bg-nmood-cta text-primary-foreground text-[13px] font-semibold flex items-center justify-center gap-1.5 shadow-soft transition-transform"
          >
            <Heart className={`w-[15px] h-[15px] transition-all duration-300 ${interested ? 'fill-current' : ''}`} />
            Interested
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}