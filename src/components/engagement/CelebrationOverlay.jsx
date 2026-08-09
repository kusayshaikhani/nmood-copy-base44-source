import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { CELEBRATION_ACHIEVEMENT_IDS } from '@/lib/engagement-engine';
import { isEngagementQuietRoute } from '@/lib/engagement-gating';

const STORAGE_KEY = 'inmood:celebrated';

const loadSeen = () => {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'));
  } catch {
    return new Set();
  }
};

const saveSeen = (set) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  } catch {
    // ignore
  }
};

// Subtle, short celebration overlay for first-time meaningful moments.
export default function CelebrationOverlay({ achievements }) {
  const [active, setActive] = useState(null);
  const location = useLocation();

  useEffect(() => {
    if (!achievements?.length) { setActive(null); return; }
    // Never show (and clear any active) on detail/action routes where it can
    // cover CTAs — including when navigating there mid-celebration.
    if (isEngagementQuietRoute(location.pathname)) { setActive(null); return; }
    const seen = loadSeen();
    const newlyUnlocked = achievements.find(
      (a) => a.unlocked && CELEBRATION_ACHIEVEMENT_IDS.includes(a.id) && !seen.has(a.id)
    );
    if (newlyUnlocked) {
      setActive(newlyUnlocked);
      seen.add(newlyUnlocked.id);
      saveSeen(seen);
      const t = setTimeout(() => setActive(null), 3200);
      return () => clearTimeout(t);
    }
  }, [achievements, location.pathname]);

  const Icon = active?.icon || Sparkles;

  if (!active) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none animate-fade-in">
      <div className="flex flex-col items-center gap-3 px-8 py-7 rounded-3xl bg-card/95 backdrop-blur-xl border border-primary/20 shadow-2xl animate-scale-in">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon className="w-8 h-8 text-primary" />
        </div>
        <div className="text-center">
          <p className="text-xs font-medium text-primary uppercase tracking-wider">Achievement unlocked</p>
          <p className="text-lg font-bold mt-0.5">{active.title}</p>
          <p className="text-sm text-muted-foreground mt-1">{active.description}</p>
        </div>
      </div>
    </div>
  );
}