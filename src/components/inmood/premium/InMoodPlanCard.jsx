import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, BadgeCheck, Heart, Bookmark, Sparkles, Clock, CalendarDays } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import SmartImage from '@/components/shared/SmartImage';
import { useLocalization } from '@/lib/i18n/useLocalization';
import moment from 'moment';
import { expStartMoment, expTimeLabel } from '@/lib/experience-utils';
import { getCategoryIcon } from '@/lib/inmood-categories';
import { aiInsight } from '@/lib/inmood-feed-engine';

function dayLabel(exp) {
  const m = expStartMoment(exp);
  if (!m || !m.isValid()) return (exp?.date || '');
  const diff = m.clone().startOf('day').diff(moment().startOf('day'), 'days');
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return m.format('MMM D');
}

function startsInLabel(exp) {
  const m = expStartMoment(exp);
  if (!m || !m.isValid()) return null;
  const diffMs = m.diff(moment());
  if (diffMs < 0 || diffMs > 4 * 3600000) return null;
  const hrs = Math.floor(diffMs / 3600000);
  const mins = Math.floor((diffMs % 3600000) / 60000);
  if (hrs >= 1) return `${hrs}h ${mins}m`;
  return `${mins}m`;
}

function isNearlyFull(exp) {
  const cap = exp.capacity || exp.maxAttendees || 0;
  const filled = exp.spotsFilled || exp.attendees?.length || 0;
  return cap > 0 && filled / cap >= 0.8 && filled < cap;
}

function isJustPosted(exp) {
  if (!exp.created_date) return false;
  const diff = Date.now() - new Date(exp.created_date).getTime();
  return diff >= 0 && diff < 3600000;
}

function getStatusBadges(exp, t) {
  const badges = [];
  const m = expStartMoment(exp);
  const diffMs = m && m.isValid() ? m.diff(moment()) : -1;
  if (diffMs >= 0 && diffMs <= 3 * 3600000) badges.push({ emoji: '⚡', label: t('inmood.redesign.card.starting_soon') });
  if ((exp.tags || []).includes('featured') || exp.featured) badges.push({ emoji: '⭐', label: t('inmood.redesign.card.featured') });
  if (exp.isAiPick || (exp.tags || []).includes('ai-pick')) badges.push({ emoji: '✨', label: t('inmood.redesign.card.ai_pick') });
  if ((exp.tags || []).includes('popular') || exp.isPopular) badges.push({ emoji: '🔥', label: t('inmood.redesign.card.trending') });
  if (isJustPosted(exp)) badges.push({ emoji: '🆕', label: t('inmood.redesign.card.just_posted') });
  return badges.slice(0, 2);
}

function getInterestChips(exp) {
  return [exp.category, ...(exp.tags || []).slice(0, 3)].filter(Boolean).slice(0, 3);
}

const getWishlist = () => {
  try { return JSON.parse(localStorage.getItem('inmood_wishlist') || '[]'); } catch { return []; }
};

export default function InMoodPlanCard({ experience, index, emotion, interests, onLongPress }) {
  const navigate = useNavigate();
  const { t } = useLocalization();
  const [interested, setInterested] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [saved, setSaved] = useState(() => getWishlist().includes(String(experience.id)));
  const pressTimer = useRef(null);

  const { image, title, host, distance, verified, venue } = experience;
  const portrait = host?.avatar || image;
  const time = expTimeLabel(experience);
  const location = venue?.name || venue?.address || experience.location || '';
  const day = dayLabel(experience);
  const interestedCount = experience.attendees?.length || experience.spotsFilled || 0;
  const chips = getInterestChips(experience);
  const startsIn = startsInLabel(experience);
  const nearlyFull = isNearlyFull(experience);
  const statusBadges = getStatusBadges(experience, t);
  const insight = aiInsight(experience, emotion, interests);
  const age = host?.age || host?.member_age;

  const handleInterested = (e) => {
    e.stopPropagation();
    if (!interested) {
      setInterested(true);
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 600);
    }
    navigate(`/experience/${experience.id}`);
  };

  const toggleSave = (e) => {
    e.stopPropagation();
    const list = getWishlist();
    const idStr = String(experience.id);
    if (list.includes(idStr)) {
      localStorage.setItem('inmood_wishlist', JSON.stringify(list.filter((x) => x !== idStr)));
      setSaved(false);
    } else {
      localStorage.setItem('inmood_wishlist', JSON.stringify([...list, idStr]));
      setSaved(true);
    }
  };

  const startPress = () => {
    pressTimer.current = setTimeout(() => onLongPress?.(experience), 500);
  };
  const cancelPress = () => { if (pressTimer.current) clearTimeout(pressTimer.current); };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.3), ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.985 }}
      onContextMenu={(e) => { if (onLongPress) e.preventDefault(); }}
      onTouchStart={onLongPress ? startPress : undefined}
      onTouchEnd={onLongPress ? cancelPress : undefined}
      onTouchMove={onLongPress ? cancelPress : undefined}
      onMouseDown={onLongPress ? startPress : undefined}
      onMouseUp={onLongPress ? cancelPress : undefined}
      onMouseLeave={onLongPress ? cancelPress : undefined}
      className="group w-full flex flex-row rounded-[20px] overflow-hidden bg-card/85 backdrop-blur-sm border border-border/30 shadow-soft hover:shadow-elevated transition-[box-shadow,transform] duration-300 will-change-transform min-h-[290px]"
    >
      {/* ── LEFT COLUMN — portrait (40%) ───────────────────────── */}
      <div className="relative w-[40%] flex-shrink-0 overflow-hidden">
        <div className="absolute inset-0 group-hover:scale-[1.04] transition-transform duration-700 ease-out">
          <SmartImage
            src={portrait}
            alt={host?.name || title}
            rounded="rounded-none"
            objectFit="object-cover object-[center_28%]"
            className="w-full h-full"
            fallback={
              <div className="w-full h-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
                <span className="text-5xl font-bold text-white/80">{host?.name?.charAt(0) || '?'}</span>
              </div>
            }
          />
        </div>
        {/* Subtle warm cinematic tint for natural lighting feel */}
        <div className="absolute inset-0 bg-amber-500/8 mix-blend-soft-light pointer-events-none" />
        {/* Cinematic gradient — soft top vignette, stronger bottom for badge readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-black/25 pointer-events-none" />

        {/* Online badge — top-left */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-md rounded-full px-2.5 py-1 border border-white/10">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-white text-[11px] font-medium">{t('inmood.redesign.card.online')}</span>
        </div>

        {/* Status badges — top-right of portrait */}
        {statusBadges.length > 0 && (
          <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
            {statusBadges.map((b, i) => (
              <span key={i} className="flex items-center gap-1 bg-black/55 backdrop-blur-md rounded-full px-2 py-0.5 border border-white/10 text-white text-[10px] font-medium">
                <span>{b.emoji}</span>
                <span>{b.label}</span>
              </span>
            ))}
          </div>
        )}

        {/* Distance badge — elegant, semi-transparent */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/30 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/15 shadow-sm">
          <MapPin className="w-3 h-3 text-white/90" />
          <span className="text-white/95 text-[11px] font-medium tracking-tight">{distance} {t('inmood.redesign.card.away')}</span>
        </div>

        {/* Capacity / starts-in indicator — bottom-right of portrait */}
        {(startsIn || nearlyFull) && (
          <div className="absolute bottom-3 right-3">
            {startsIn ? (
              <span className="flex items-center gap-1 bg-primary/90 backdrop-blur-md rounded-full px-2.5 py-1 text-white text-[10px] font-semibold">
                <Clock className="w-3 h-3" /> {t('inmood.redesign.card.starts_in', { time: startsIn })}
              </span>
            ) : (
              <span className="flex items-center gap-1 bg-warning/90 backdrop-blur-md rounded-full px-2.5 py-1 text-white text-[10px] font-semibold">
                <Sparkles className="w-3 h-3" /> {t('inmood.redesign.card.nearly_full')}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── RIGHT COLUMN — content (60%) ───────────────────────── */}
      <div className="relative flex-1 min-w-0 p-4 sm:p-5 flex flex-col">
        {/* Bookmark — top-right corner */}
        <motion.button
          type="button"
          onClick={toggleSave}
          whileTap={{ scale: 0.82 }}
          animate={{ scale: saved ? [1, 1.28, 0.95, 1] : 1 }}
          transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
          aria-label={t('inmood.redesign.card.save')}
          className="absolute top-3 right-3 w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center transition-colors duration-200 z-10"
        >
          <Bookmark className={`w-[18px] h-[18px] transition-all duration-300 ${saved ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
        </motion.button>

        {/* 1 — "I'm Nmood for" — small uppercase label */}
        <div className="flex items-center gap-2 pr-10">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/20 to-accent/25 flex items-center justify-center flex-shrink-0 text-base">
            {getCategoryIcon(experience)}
          </div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.08em] truncate">
            {t('inmood.redesign.card.im_nmood_for')}
          </p>
        </div>

        {/* 2 — Activity title — largest typography, max two lines */}
        <h3 className="text-[19px] font-bold leading-[1.25] mt-3 line-clamp-2 pr-10 text-foreground">{title}</h3>

        {/* AI insight — subtle premium accent */}
        <p className="flex items-center gap-1.5 mt-2 text-[11px] text-primary/90 font-medium pr-10">
          <Sparkles className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{t(insight.key, insight.params)}</span>
        </p>

        {/* 3 — Event details — small icons, muted secondary text */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-3 text-xs text-muted-foreground">
          {day && <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5 flex-shrink-0" /> {day}</span>}
          {time && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 flex-shrink-0" /> {time}</span>}
          {location && <span className="flex items-center gap-1 min-w-0"><MapPin className="w-3.5 h-3.5 flex-shrink-0" /> <span className="truncate">{location}</span></span>}
        </div>

        <div className="my-4 border-t border-border/30" />

        {/* 4 — Member profile — name and age in bold */}
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar className="w-9 h-9 border border-border/50 flex-shrink-0">
            <AvatarImage src={host?.avatar} alt={host?.name} />
            <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
              {host?.name?.charAt(0) || '?'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold truncate text-foreground">{host?.name || t('inmood.redesign.card.host')}</span>
              {age && <span className="text-xs font-bold text-muted-foreground flex-shrink-0">{age}</span>}
              {verified && <BadgeCheck className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
            </div>
            <div className="flex flex-wrap items-center gap-1 mt-1.5">
              {chips.map((chip, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/60 text-muted-foreground truncate max-w-[80px] transition-colors duration-300">{chip}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Social proof line */}
        <div className="flex items-center gap-1.5 mt-3 text-[11px] text-muted-foreground">
          <Heart className="w-3 h-3" />
          <span>{interestedCount} {t('inmood.redesign.card.interested_suffix')}</span>
        </div>

        {/* 5 — Action buttons — outlined secondary + primary gradient */}
        <div className="flex gap-2.5 mt-auto pt-5">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); navigate('/discover-people'); }}
            className="flex-1 min-w-0 h-11 min-h-[44px] rounded-button border border-border/70 bg-card text-foreground text-sm font-semibold transition-[background-color,border-color,transform] duration-200 hover:bg-muted/50 active:scale-[0.97] overflow-hidden"
          >
            <span className="truncate block px-1">{t('inmood.redesign.card.view_profile')}</span>
          </button>
          <motion.button
            type="button"
            onClick={handleInterested}
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.02, boxShadow: '0 16px 36px -12px rgba(36,21,109,0.32)' }}
            animate={celebrate ? { scale: [1, 1.08, 1] } : {}}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden flex-1 min-w-0 h-11 min-h-[44px] rounded-button bg-nmood-cta text-primary-foreground text-sm font-bold shadow-card flex items-center justify-center gap-1.5"
          >
            <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 active:opacity-100 group-active:opacity-100 bg-gradient-to-r from-white/0 via-white/20 to-white/0" />
            <Heart className={`relative z-10 w-4 h-4 flex-shrink-0 transition-all duration-300 ${interested ? 'fill-current scale-110' : ''}`} />
            <span className="relative z-10 truncate">{t('inmood.redesign.card.interested')}</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}