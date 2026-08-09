import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Plus, Users, Sparkles, ChevronDown } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/lib/AuthContext';
import { getBrandLogoUrl } from '@/lib/brand-assets';
import { useUnreadCount } from '@/lib/notifications-store';
import HeroTitle from '@/components/ui/premium/HeroTitle';

const HOST_ITEMS = [
  { label: 'Create Circle', icon: Users, path: '/host/create-circle' },
  { label: 'Create Experience', icon: Sparkles, path: '/host/create' },
];

export default function V2Header() {
  const navigate = useNavigate();
  const { member } = useAuth();
  const unread = useUnreadCount();
  const [hostOpen, setHostOpen] = useState(false);
  const name = member?.display_name || member?.full_name || '';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="relative bg-nmood-gradient px-6 pt-[calc(3.5rem+env(safe-area-inset-top))] pb-12"
    >
      {/* Top row: logo · Host · notifications · avatar */}
      <div className="flex items-center justify-between gap-3">
        <img src={getBrandLogoUrl('dark')} alt="Nmood" draggable={false} className="h-7 w-auto object-contain" />

        <div className="flex items-center gap-2.5">
          {/* Host — premium gradient action with dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setHostOpen((v) => !v)}
              className="h-9 inline-flex items-center gap-1.5 px-3.5 rounded-full bg-nmood-cta text-white text-[13px] font-semibold ring-1 ring-white/25 shadow-md active:scale-95 transition-transform duration-200"
            >
              <Plus className="w-4 h-4" strokeWidth={2.4} />
              Host
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${hostOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {hostOpen && (
                <>
                  <button type="button" aria-label="Close menu" onClick={() => setHostOpen(false)} className="fixed inset-0 z-40 cursor-default" />
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute right-0 top-11 z-50 w-52 rounded-2xl border border-border/60 bg-card shadow-float overflow-hidden"
                  >
                    {HOST_ITEMS.map((it) => {
                      const Icon = it.icon;
                      return (
                        <button
                          key={it.path}
                          type="button"
                          onClick={() => { setHostOpen(false); navigate(it.path); }}
                          className="w-full flex items-center gap-3 px-3.5 py-3 text-sm font-medium text-foreground hover:bg-muted/60 transition-colors text-left"
                        >
                          <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Icon className="w-4 h-4 text-primary" />
                          </span>
                          {it.label}
                        </button>
                      );
                    })}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <button
            type="button"
            onClick={() => navigate('/notifications')}
            aria-label="Notifications"
            className="relative w-10 h-10 flex items-center justify-center rounded-full bg-white/10 active:scale-95 transition-transform duration-200"
          >
            <Bell className="w-5 h-5 text-white" />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 rounded-full bg-white text-primary text-[9px] font-bold flex items-center justify-center leading-none">
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </button>

          <button type="button" onClick={() => navigate('/profile')} aria-label="Profile" className="rounded-full">
            <Avatar className="w-10 h-10 border-2 border-white/30">
              <AvatarImage src={member?.photo_url} alt={name} />
              <AvatarFallback className="text-[13px] bg-white/15 text-white font-medium">
                {name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
          </button>
        </div>
      </div>

      {/* Hero copy */}
      <HeroTitle className="mt-6 text-white leading-tight">
        What are people Nmood for today?
      </HeroTitle>
      <p className="mt-1.5 text-white/80 text-sm font-medium">Real plans. Real people. Real life.</p>
    </motion.div>
  );
}