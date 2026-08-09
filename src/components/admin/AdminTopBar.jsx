import React, { useState, useEffect, useRef } from 'react';
import { Menu, Moon, Sun, Bell, ChevronDown } from 'lucide-react';
import { useTheme } from '@/lib/ThemeProvider';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import GlobalSearch from './GlobalSearch';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function AdminTopBar({ onMenuClick }) {
  const { t } = useLocalization();
  const { theme, setTheme } = useTheme();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border safe-top">
      <div className="flex items-center gap-3 px-4 sm:px-6 h-16">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
          <Menu className="w-5 h-5" />
        </Button>

        <div className="flex-1 max-w-md">
          <GlobalSearch />
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
          </Button>

          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>

          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-muted/50 transition-default"
            >
              <Avatar className="w-7 h-7">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">{t('admin.ad')}</AvatarFallback>
              </Avatar>
              <span className="hidden sm:block text-sm font-medium">{t('admin.admin')}</span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            {profileOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 rounded-xl border bg-popover shadow-lg p-1.5 z-50">
                <div className="px-2 py-1.5 border-b border-border mb-1">
                  <p className="text-sm font-medium">{t('admin.administrator')}</p>
                  <p className="text-xs text-muted-foreground">{t('admin.admininmoodcom')}</p>
                </div>
                <button className="w-full text-left px-2 py-1.5 rounded-lg text-sm hover:bg-muted/50 transition-default">{t('admin.profile_settings')}</button>
                <button className="w-full text-left px-2 py-1.5 rounded-lg text-sm hover:bg-muted/50 transition-default">{t('admin.security')}</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}