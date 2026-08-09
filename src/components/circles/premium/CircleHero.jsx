import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Share2, MoreHorizontal, Lock, Globe, Crown, BadgeCheck, Users } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

/**
 * Premium full-bleed Circle hero — 320px cover, gradient overlay,
 * glass top-nav controls, identity block overlaid at the bottom.
 */
export default function CircleHero({ circle, onShare, onMore }) {
  const navigate = useNavigate();
  const { t } = useLocalization();
  const isPrivate = circle.privacy === 'private' || circle.privacy === 'invite';

  return (
    <div className="relative w-full h-[320px] sm:h-[340px] rounded-b-[32px] overflow-hidden bg-muted">
      {circle.cover_photo ? (
        <motion.img
          initial={{ scale: 1.08 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          src={circle.cover_photo}
          alt={circle.name}
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
        />
      ) : (
        <div className="absolute inset-0 bg-nmood-gradient" />
      )}
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/30" />

      {/* Top navigation */}
      <div className="absolute top-0 inset-x-0 px-4 pt-[max(1rem,env(safe-area-inset-top))] flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label={t('common.back')}
          className="w-11 h-11 rounded-full glass shadow-soft flex items-center justify-center text-foreground hover:bg-white/90 transition-default"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onShare}
            aria-label={t('hosting.success.share')}
            className="w-11 h-11 rounded-full glass shadow-soft flex items-center justify-center text-foreground hover:bg-white/90 transition-default"
          >
            <Share2 className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={onMore}
            aria-label={t('common.more')}
            className="w-11 h-11 rounded-full glass shadow-soft flex items-center justify-center text-foreground hover:bg-white/90 transition-default"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Identity block */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className="absolute bottom-0 inset-x-0 p-5 sm:p-6"
      >
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {circle.category && (
            <span className="inline-flex items-center text-[11px] font-semibold tracking-wide uppercase text-white/90 bg-white/15 backdrop-blur-md px-2.5 py-1 rounded-full">
              {circle.category}
            </span>
          )}
          <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full ${isPrivate ? 'bg-amber-400/20 text-amber-100' : 'bg-emerald-400/20 text-emerald-100'}`}>
            {isPrivate ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
            {circle.privacy === 'invite' ? t('circles.detail.invite_only') : circle.privacy === 'private' ? t('community.detail.private') : t('circles.edit.privacy_public')}
          </span>
          {circle.is_featured && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-amber-400/20 text-amber-100 px-2.5 py-1 rounded-full">
              <BadgeCheck className="w-3 h-3" /> {t('circles.detail.verified')}
            </span>
          )}
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white text-balance leading-tight tracking-tight">{circle.name}</h1>
        {circle.description && (
          <p className="text-sm text-white/80 mt-1.5 line-clamp-2 max-w-xl">{circle.description}</p>
        )}
        <div className="flex items-center gap-3 mt-2.5 text-xs text-white/80">
          <span className="inline-flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {circle.member_count}{circle.max_members ? `/${circle.max_members}` : ''}</span>
          {circle.host?.name && (
            <span className="inline-flex items-center gap-1"><Crown className="w-3.5 h-3.5" /> {circle.host.name}</span>
          )}
        </div>
      </motion.div>
    </div>
  );
}