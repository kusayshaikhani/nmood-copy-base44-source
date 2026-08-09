import React, { useEffect, useState } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/lib/ThemeProvider';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { cn } from '@/lib/utils';

/**
 * UI-022 — Segmented Light / Dark / System theme control.
 * Stores the chosen mode in localStorage and, when "system" is selected,
 * follows the OS preference live. Presentation only; ThemeProvider is
 * untouched — we simply call setTheme with the resolved value.
 */
export default function SettingsThemeSwitcher() {
  const { t } = useLocalization();
  const { theme, setTheme } = useTheme();
  const [mode, setMode] = useState(() => localStorage.getItem('inmood-theme-mode') || 'light');

  useEffect(() => {
    if (mode !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => setTheme(mq.matches ? 'dark' : 'light');
    handler();
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const apply = (m) => {
    setMode(m);
    localStorage.setItem('inmood-theme-mode', m);
    if (m === 'system') {
      setTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    } else {
      setTheme(m);
    }
  };

  const active = mode === 'system' ? 'system' : theme;

  const opts = [
    { id: 'light', icon: Sun, label: t('settings.theme_light') },
    { id: 'dark', icon: Moon, label: t('settings.theme_dark') },
    { id: 'system', icon: Monitor, label: t('settings.theme_system') },
  ];

  return (
    <div className="flex items-center gap-1 p-1 rounded-button bg-muted/70">
      {opts.map(({ id, icon: I, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => apply(id)}
          aria-pressed={active === id}
          className={cn(
            'flex items-center gap-1.5 h-8 px-3 rounded-[14px] text-[12.5px] font-medium transition-default',
            active === id
              ? 'bg-card text-foreground shadow-soft'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <I className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}