import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, Bell, RotateCcw, Users, Compass, Lightbulb } from 'lucide-react';
import { getBrandLogoUrl } from '@/lib/brand-assets';
import { useUnreadCount } from '@/lib/notifications-store';
import { useLocalization } from '@/lib/i18n/useLocalization';
import HeroTitle from '@/components/ui/premium/HeroTitle';
import ThemeToggle from '@/components/layout/ThemeToggle';
import HeaderAvatar from '@/components/layout/HeaderAvatar';

// UI-001 — premium mood quick-entry tiles. All routes already exist; no new
// navigation logic is introduced.
const MOOD_CARDS = [
  { key: 'home.mood.reset', icon: RotateCcw, path: '/inmood' },
  { key: 'home.mood.find_pals', icon: Users, path: '/search?tab=pals' },
  { key: 'home.mood.explore', icon: Compass, path: '/explore' },
  { key: 'home.mood.inspiration', icon: Lightbulb, path: '/saved' },
];

function getGreetingKey() {
  const h = new Date().getHours();
  if (h < 12) return 'home.greeting_morning';
  if (h < 18) return 'home.greeting_afternoon';
  return 'home.greeting_evening';
}

export default function PremiumHero({ firstName, onOpenMenu }) {
  const unread = useUnreadCount();
  const { t } = useLocalization();
  const greeting = t(getGreetingKey());
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="relative bg-nmood-gradient px-6 pt-[calc(3.5rem+env(safe-area-inset-top))] pb-20"
    >
      {/* Top row: hamburger · logo · notifications */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Menu"
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 active:scale-95 transition-transform duration-200"
        >
          <Menu className="w-5 h-5 text-white" />
        </button>
        <img
          src={getBrandLogoUrl('dark')}
          alt="Nmood"
          draggable={false}
          className="h-7 w-auto object-contain"
        />
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

      {/* Greeting */}
      <p className="mt-8 text-white/80 text-sm font-medium">
        {greeting}, {firstName} 👋
      </p>
      {/* Title */}
      <HeroTitle className="mt-1.5 text-white leading-tight">
        {t('home.what_are_you_nmood_for')}
      </HeroTitle>

      {/* Mood cards — native horizontal swipe, no arrow control */}
      <div className="mt-6 -mx-6 px-6">
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-1 momentum-scroll">
          {MOOD_CARDS.map(({ key, icon: Icon, path }) => (
            <Link key={key} to={path} className="flex-shrink-0">
              <motion.div
                whileTap={{ scale: 0.95 }}
                className="w-[90px] h-[90px] rounded-card bg-white/15 backdrop-blur-md border border-white/20 flex flex-col items-center justify-center gap-1.5"
              >
                <Icon className="w-6 h-6 text-white" strokeWidth={2} />
                <span className="text-white text-xs font-medium">{t(key)}</span>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </motion.div>
  );
}