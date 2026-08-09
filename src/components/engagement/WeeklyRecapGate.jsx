import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useEngagement } from '@/hooks/useEngagement';
import { isEngagementQuietRoute } from '@/lib/engagement-gating';
import WeeklyRecapSheet from '@/components/engagement/WeeklyRecapSheet';

const LAST_SHOWN_KEY = 'inmood:weeklyRecap:lastShown';

// Auto-opens the weekly recap at most once per authenticated session, at most
// once per week (cross-session), and never on detail/action routes where it
// could cover CTAs. Mounted once in AppShell, so it stays mounted across
// navigation — the session ref persists dismissal reliably across routes.
export default function WeeklyRecapGate() {
  const { recap, loading } = useEngagement();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  // Session-scoped flag: survives in-app navigation (AppShell stays mounted),
  // resets on a full app reload. Guarantees the sheet never reopens in the
  // same session after being shown/dismissed, even if the effect re-runs.
  const shownThisSessionRef = useRef(false);

  useEffect(() => {
    if (loading || !recap) return;
    if (shownThisSessionRef.current) return;

    // Weekly eligibility (cross-session) — at most once per 7 days.
    let lastShown = null;
    try {
      lastShown = localStorage.getItem(LAST_SHOWN_KEY);
    } catch {
      // ignore
    }
    const now = Date.now();
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    if (lastShown && now - Number(lastShown) < weekMs) return;

    // Route gating — never open on detail/action routes (CTAs / composer).
    if (isEngagementQuietRoute(location.pathname)) return;

    // Eligible + safe route → show, and mark shown for this session + week.
    shownThisSessionRef.current = true;
    setOpen(true);
    try {
      localStorage.setItem(LAST_SHOWN_KEY, String(now));
    } catch {
      // ignore
    }
  }, [loading, recap, location.pathname]);

  // Auto-close the sheet if the user navigates to a detail/action route while
  // it's open, so it never covers CTAs / the composer.
  useEffect(() => {
    if (open && isEngagementQuietRoute(location.pathname)) {
      setOpen(false);
    }
  }, [location.pathname, open]);

  return <WeeklyRecapSheet open={open} onOpenChange={setOpen} recap={recap} />;
}