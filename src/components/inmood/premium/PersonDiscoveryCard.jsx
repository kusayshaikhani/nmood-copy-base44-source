import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MapPin,
  BadgeCheck,
  CalendarDays,
  Clock,
  Bookmark,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import moment from 'moment';
import { expStartMoment, expTimeLabel } from '@/lib/experience-utils';
import MemberImage from '@/components/shared/MemberImage';

/**
 * PersonDiscoveryCard
 * A premium people-discovery card floating on the Nmood gradient.
 * White, softly elevated surface; the person is the hero.
 */
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

export default function PersonDiscoveryCard({ experience, index }) {
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

  const openExperience = () => navigate(`/experience/${experience.id}`);

  const handleInterested = (e) => {
    e.stopPropagation();
    if (!interested) {
      setInterested(true);
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 600);
    }
    openExperience();
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
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.3), ease: [0.22, 1, 0.36, 1] }}
      whileTap={{ scale: 0.99 }}
      onClick={openExperience}
      className="group relative flex w-full min-h-[230px] rounded-[22px] overflow-hidden bg-white border border-white/50 shadow-elevated cursor-pointer hover:shadow-float hover:border-white/80 transition-all duration-300"
    >
      {/* ═══ LEFT COLUMN — portrait is the hero (40%) ═══ */}
      <div className="relative w-[40%] h-full flex-shrink-0 overflow-hidden">
        <MemberImage
          src={portrait}
          alt={host?.name || 'Member'}
          initial={host?.name}
          className="absolute inset-0 w-full h-full"
          imgClassName="object-[center_28%] group-hover:scale-[1.04]"
        />
        {/* Soft depth gradient for badge legibility over the photo */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 pointer-events-none" />

        {/* Online indicator — top left */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/30 backdrop-blur-md rounded-full px-2 py-0.5 border border-white/15">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-white/95 text-[10px] font-medium">Online</span>
        </div>

        {/* Distance indicator — bottom left */}
        {distance && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/30 backdrop-blur-md rounded-full px-2.5 py-1 border border-white/15">
            <MapPin className="w-3 h-3 text-white/90" />
            <span className="text-white/95 text-[11px] font-medium">{distance}</span>
          </div>
        )}
      </div>

      {/* ═══ RIGHT COLUMN — identity + intent (60%) ═══ */}
      <div className="relative w-[60%] min-w-0 p-[18px] flex flex-col">
        {/* Bookmark — top right */}
        <motion.button
          type="button"
          onClick={toggleSave}
          whileTap={{ scale: 0.82 }}
          animate={{ scale: saved ? [1, 1.28, 0.95, 1] : 1 }}
          transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
          aria-label="Save"
          className="absolute top-[18px] right-[18px] w-9 h-9 rounded-full hover:bg-secondary flex items-center justify-center transition-colors duration-200 z-10"
        >
          <Bookmark className={`w-[18px] h-[18px] transition-all duration-300 ${saved ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
        </motion.button>

        {/* Colored Nmood icon + "I'm in the mood for" */}
        <div className="flex items-center gap-2 pr-10">
          <span className="w-6 h-6 rounded-full bg-nmood-cta text-white text-[11px] font-extrabold flex items-center justify-center flex-shrink-0">N</span>
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground truncate">I'm in the mood for</p>
        </div>

        {/* Activity-first title (largest text, max 2 lines) */}
        <h3 className="text-[15px] font-bold leading-snug mt-2.5 line-clamp-2 pr-10 text-foreground">{title}</h3>

        {/* Single info row: calendar · time · location */}
        <div className="flex items-center gap-2 mt-3 text-[11px] text-muted-foreground min-w-0">
          <span className="flex items-center gap-1 flex-shrink-0"><CalendarDays className="w-3 h-3" />{day}</span>
          <span className="w-px h-3 bg-border flex-shrink-0" />
          {time && <span className="flex items-center gap-1 flex-shrink-0"><Clock className="w-3 h-3" />{time}</span>}
          {time && location && <span className="w-px h-3 bg-border flex-shrink-0" />}
          {location && (
            <span className="flex items-center gap-1 min-w-0"><MapPin className="w-3 h-3 flex-shrink-0" /><span className="truncate">{location}</span></span>
          )}
        </div>

        {/* Thin divider */}
        <div className="my-3 h-px bg-border" />

        {/* Mini member profile */}
        <div className="flex items-center gap-2 min-w-0">
          <Avatar className="w-7 h-7 border border-border flex-shrink-0">
            <AvatarImage src={host?.avatar} alt={host?.name} />
            <AvatarFallback className="text-[11px] bg-muted text-foreground font-semibold">
              {host?.name?.charAt(0) || '?'}
            </AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-sm font-semibold text-foreground truncate">{host?.name || 'Member'}</span>
            {age && <span className="text-xs font-medium text-muted-foreground flex-shrink-0">{age}</span>}
            {verified && <BadgeCheck className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
          </div>
        </div>

        {/* Interest chips (max 3) */}
        {chips.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {chips.map((c, i) => (
              <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground border border-border/60 truncate max-w-[90px]">{c}</span>
            ))}
          </div>
        )}

        {/* Equal-width premium action buttons — bottom aligned */}
        <div className="flex gap-2.5 mt-auto pt-4">
          <button
            type="button"
            onClick={viewProfile}
            className="flex-1 h-10 rounded-button border border-border bg-transparent text-foreground text-sm font-semibold transition-colors duration-200 hover:bg-secondary active:scale-[0.97]"
          >
            View Profile
          </button>
          <motion.button
            type="button"
            onClick={handleInterested}
            whileTap={{ scale: 0.96 }}
            animate={celebrate ? { scale: [1, 1.06, 1] } : {}}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 h-10 rounded-button bg-nmood-cta text-white text-sm font-bold shadow-lg shadow-primary/25 flex items-center justify-center gap-1.5"
          >
            <span className={`w-3.5 h-3.5 rounded-full bg-white transition-all duration-300 ${interested ? 'scale-100' : 'scale-0'}`} />
            Interested
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}