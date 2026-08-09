import React from 'react';
import { Moon } from 'lucide-react';
import { useTheme } from '@/lib/ThemeProvider';

/**
 * Crescent theme toggle. Always renders the Moon (crescent) icon so the
 * control reads consistently across light and dark mode; clicking toggles
 * the theme. `variant="hero"` styles it for gradient heroes (white icon on
 * translucent glass); `variant="solid"` styles it for standard surfaces.
 */
export default function ThemeToggle({ variant = 'solid' }) {
  const { theme, setTheme } = useTheme();
  const hero = variant === 'hero';
  return (
    <button
      type="button"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      aria-label="Toggle theme"
      className={
        hero
          ? 'w-10 h-10 flex items-center justify-center rounded-full bg-white/10 active:scale-95 transition-transform duration-200'
          : 'inline-flex items-center justify-center rounded-full h-9 w-9 text-foreground hover:bg-secondary transition-default'
      }
    >
      <Moon className={hero ? 'w-5 h-5 text-white' : 'w-5 h-5'} />
    </button>
  );
}