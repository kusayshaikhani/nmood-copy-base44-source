import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Bell, Filter, Shield, Coffee, Heart, Camera, Dumbbell, Palette, Music } from 'lucide-react';
import { getBrandLogoUrl } from '@/lib/brand-assets';
import { useUnreadCount } from '@/lib/notifications-store';
import HeroTitle from '@/components/ui/premium/HeroTitle';
import { useLocalization } from '@/lib/i18n/useLocalization';
import ThemeToggle from '@/components/layout/ThemeToggle';
import HeaderAvatar from '@/components/layout/HeaderAvatar';

/**
 * UI-005 — Premium gradient hero for the Discovery (People) page.
 * Back · logo · notifications, large title, glass filter + privacy buttons,
 * and interactive mood cards that map to the existing `interest` filter.
 */
const MOOD_CARDS = [
  { label: 'Coffee', icon: Coffee, value: 'Coffee' },
  { label: 'Wellness', icon: Heart, value: 'Wellness' },
  { label: 'Photo', icon: Camera, value: 'Photography' },
  { label: 'Active', icon: Dumbbell, value: 'Sports' },
  { label: 'Art', icon: Palette, value: 'Art' },
  { label: 'Music', icon: Music, value: 'Music' },
];

export default function DiscoverHero({ title, subtitle, onBack, onOpenFilters, activeFilterCount, onOpenPrivacy, activeInterest, onMoodToggle }) {
  const unread = useUnreadCount();
  const { t } = useLocalization();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="relative bg-nmood-gradient px-6 pt-[calc(3.5rem+env(safe-area-inset-top))] pb-10"
    >
      {/* Top row: back · logo · notifications */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 active:scale-95 transition-transform duration-200"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <img src={getBrandLogoUrl('dark')} alt="Nmood" draggable={false} className="h-7 w-auto object-contain" />
        <div className="flex items-center gap-2">
          <ThemeToggle variant="hero" />
          <Link
            to="/notifications"
            aria-label="Notifications"
            className="relative w-10 h-10 flex items-center justify-center rounded-full bg-white/10 active:scale-95 transition-transform duration-200"
          >
            <Bell className="w-5 h-5 text-white" />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 rounded-full bg-white text-primary text-[9px] font-bold flex items-center justify-center leading-none">
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </Link>
          <HeaderAvatar variant="hero" />
        </div>
      </div>

      {/* Title + subtitle */}
      <HeroTitle className="mt-6 text-white leading-tight">{title}</HeroTitle>
      <p className="mt-1.5 text-white/80 text-sm font-medium">{subtitle}</p>

      {/* Filter + privacy glass buttons */}
      <div className="mt-5 flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenFilters}
          className="flex-1 h-12 flex items-center gap-2 px-4 rounded-input bg-white/15 backdrop-blur-md border border-white/20 text-white text-sm font-medium active:scale-[0.98] transition-default"
        >
          <Filter className="w-4 h-4" />
          <span>{t('discovery.members.filters')}</span>
          {activeFilterCount > 0 && (
            <span className="ml-auto min-w-5 h-5 px-1.5 rounded-full bg-white text-primary text-[10px] font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={onOpenPrivacy}
          aria-label="Privacy"
          className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-input bg-white/15 backdrop-blur-md border border-white/20 active:scale-95 transition-transform duration-200"
        >
          <Shield className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Interactive mood cards */}
      <div className="mt-5 flex gap-3 overflow-x-auto no-scrollbar overscroll-x-contain -mx-6 px-6 snap-x snap-mandatory">
        {MOOD_CARDS.map(({ label, icon: Icon, value }) => {
          const active = activeInterest === value;
          return (
            <button key={value} type="button" onClick={() => onMoodToggle(value)} className="flex-shrink-0 snap-start">
              <motion.div
                whileTap={{ scale: 0.95 }}
                className={`w-20 h-24 rounded-card flex flex-col items-center justify-center gap-2 border transition-default ${active ? 'bg-white border-white shadow-md' : 'bg-white/15 backdrop-blur-md border-white/20'}`}
              >
                <Icon className={`w-6 h-6 ${active ? 'text-primary' : 'text-white'}`} strokeWidth={2} />
                <span className={`text-xs font-medium ${active ? 'text-primary' : 'text-white'}`}>{label}</span>
              </motion.div>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}