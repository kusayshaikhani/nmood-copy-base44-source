import React from 'react';

import { Link, useNavigate } from 'react-router-dom';
import { Bell, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/lib/AuthContext';
import { useTheme } from '@/lib/ThemeProvider';
import { formatBadgeCount, useUnreadCount } from '@/lib/notifications-store';
import { resolveMemberName, resolveMemberInitials } from '@/lib/member-display';
import Logo from './Logo';

export default function TopBar() {
  const { user, member } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const unreadCount = useUnreadCount();

  const memberName = resolveMemberName(member, user);
  const initials = resolveMemberInitials(member, user) || 'U';

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background safe-top">
      {/* Soft Nmood blue/purple gradient wash — subtle enough to keep the logo crisp */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.06] via-accent/[0.05] to-transparent" />
      <div className="pointer-events-none absolute -top-12 -start-10 h-28 w-28 rounded-full bg-primary/10 blur-3xl opacity-70" />
      <div className="relative flex items-center justify-between h-16 px-4 sm:px-6 gap-4 max-w-5xl w-full mx-auto">
        <Logo size="sm" />

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle theme">
            <Moon className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" asChild className="relative">
            <Link to="/notifications">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span aria-label={unreadCount + ' unread notifications'} className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center ring-2 ring-background">{formatBadgeCount(unreadCount)}</span>
              )}
            </Link>
          </Button>
          <Link to="/profile" onClick={(event) => { event.preventDefault(); navigate('/profile'); }} aria-label="My Profile" className="flex items-center gap-2 rounded-full p-1.5 hover:ring-2 hover:ring-primary/20 transition-default">
            <Avatar className="w-9 h-9">
              <AvatarImage src={member && Object.hasOwn(member, 'photo_url') ? member.photo_url : user?.image_url} alt={memberName || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{initials}</AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>
    </header>
  );
}
