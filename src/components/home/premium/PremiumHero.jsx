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
  { key: 'home.mood.find_pals', icon: Users, path: '/explore?tab=people' },
  { key: 'home.mood.explore', icon: Compass, path: '/explore' },
  { key: 'home.mood.inspiration', icon: Lightbulb, path: '/saved' },
];

function getGreetingKey() {
  const h = new Date().getHours();
  if (h < 12) return 'home.greeting_morning';
  if (h < 18) return 'home.greeting_afternoon';
  return 'home.greeting_evening';
}

export default function PremiumHero({ firstName, onOpenMenu, title }) {
  const unread = useUnreadCount();
  const { t } = useLocalization();
  const greeting = t(getGreetingKey());
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="relative bg-nmood-gradient px-6 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-16"
    >
      {/* Top row: hamburger · logo · notifications */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Menu"
          className="w-11 h-11 flex items-center justify-center rounded-full bg-white/5 active:scale-95 transition-transform duration-200"
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
            className="relative w-11 h-11 flex items-center justify-center rounded-full bg-white/5 active:scale-95 transition-transform duration-200"
          >
            <Bell className="w-5 h-5 text-white" />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 rounded-full bg-white text-primary text-[11px] font-bold flex items-center justify-center leading-none">
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </Link>
          <HeaderAvatar variant="hero" />
        </div>
      </div>

      {/* Greeting */}
      <p className="mt-7 text-white/80 text-sm font-medium">
        {greeting}, {firstName}
      </p>
      {/* Title */}
      <HeroTitle className={`mt-1.5 text-white leading-tight ${title ? 'text-4xl font-bold' : ''}`}>
        {title || t('home.what_are_you_nmood_for')}
      </HeroTitle>

      {/* Existing quick actions, presented as one quiet, fully visible row. */}
      <nav aria-label="Home quick actions" className="mt-6 grid grid-cols-4 gap-2 rounded-3xl border border-white/10 bg-white/5 p-2">
        {MOOD_CARDS.map(({ key, icon: Icon, path }) => (
          <Link key={key} to={path} className="flex min-h-20 min-w-0 flex-col items-center justify-start gap-2 rounded-2xl py-3 text-center text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
            <Icon className="h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden="true"/>
            <span className="text-[13px] font-medium leading-5 [overflow-wrap:anywhere]">{t(key)}</span>
          </Link>
        ))}
      </nav>
    </motion.div>
  );
}