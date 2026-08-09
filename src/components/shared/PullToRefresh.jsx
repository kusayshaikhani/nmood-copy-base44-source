import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { emitGlobalRefresh } from '@/lib/interactions';

/**
 * Global pull-to-refresh overlay (App Store scan fix).
 *
 * Mobile-safe gesture: listens to document-level touch events and triggers
 * a global `nmood:refresh` event only when ALL of the following are true:
 *  - page is scrolled to the very top (scrollTop ≤ 2)
 *  - single finger, downward drag
 *  - touch did not start on an input, textarea, select, or contenteditable
 *  - no modal / sheet / dialog overlay is open
 *  - touch is not in the bottom-navigation gutter or screen edge gutters
 *  - horizontal movement does not exceed the vertical pull (carousel guard)
 *  - no refresh is already in progress and debounce window has elapsed
 *
 * All handlers read from refs (not state) so listeners are bound once and
 * never stale.  Passive listeners — never blocks normal scrolling.
 */
const THRESHOLD = 72;        // px pull needed to trigger
const MAX_PULL = 120;        // visual clamp
const HORIZONTAL_LOCK = 45;  // px horizontal drift before we abort
const DEBOUNCE_MS = 400;     // min gap between refresh triggers
const EDGE_GUTTER = 24;      // px from left/right edge (browser back gesture)
const NAV_GUTTER = 90;       // px from bottom (bottom navigation)

const SKIP_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

/** Walk up from target — skip if inside a form field or marked element. */
function shouldSkipTarget(target) {
  let el = target;
  while (el && el !== document.body && el.parentElement) {
    if (SKIP_TAGS.has(el.tagName)) return true;
    if (el.isContentEditable) return true;
    if (el.dataset && el.dataset.noPull === 'true') return true;
    el = el.parentElement;
  }
  return false;
}

/** True when any Radix dialog / sheet / popover overlay is open. */
function isOverlayOpen() {
  return document.querySelector(
    '[data-state="open"][role="dialog"], ' +
    '[data-state="open"][role="dialog"]'
  ) !== null;
}

export default function PullToRefresh() {
  const reduce = useReducedMotion();
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // Refs mirror state so touch handlers (bound once) never go stale.
  const pullRef = useRef(0);
  const refreshingRef = useRef(false);
  const startY = useRef(null);
  const startX = useRef(null);
  const active = useRef(false);
  const locked = useRef(false);
  const lastRefresh = useRef(0);

  useEffect(() => { refreshingRef.current = refreshing; }, [refreshing]);

  const onTouchStart = useCallback((e) => {
    if (refreshingRef.current) return;
    if (isOverlayOpen()) { active.current = false; return; }
    if (window.scrollY > 2) { active.current = false; return; }
    if (e.touches.length > 1) { active.current = false; return; }
    const t = e.touches[0];
    // Browser edge-swipe gestures (back/forward) — never intercept.
    if (t.clientX < EDGE_GUTTER || t.clientX > window.innerWidth - EDGE_GUTTER) {
      active.current = false; return;
    }
    // Bottom navigation area — let nav taps through.
    if (t.clientY > window.innerHeight - NAV_GUTTER) {
      active.current = false; return;
    }
    if (shouldSkipTarget(t.target)) { active.current = false; return; }
    startY.current = t.clientY;
    startX.current = t.clientX;
    active.current = true;
    locked.current = false;
  }, []);

  const onTouchMove = useCallback((e) => {
    if (!active.current || startY.current === null || refreshingRef.current) return;
    const dx = e.touches[0].clientX - (startX.current || 0);
    const dy = e.touches[0].clientY - startY.current;
    // Horizontal carousel / swipe guard — abort if clearly horizontal.
    if (!locked.current && Math.abs(dx) > HORIZONTAL_LOCK && Math.abs(dx) > Math.abs(dy)) {
      locked.current = true;
      active.current = false;
      if (pullRef.current !== 0) { pullRef.current = 0; setPull(0); }
      return;
    }
    if (locked.current) return;
    if (dy > 0) {
      const next = Math.min(dy * 0.5, MAX_PULL);
      pullRef.current = next;
      setPull(next);
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!active.current) { startY.current = null; return; }
    active.current = false;
    const now = Date.now();
    if (pullRef.current >= THRESHOLD && now - lastRefresh.current > DEBOUNCE_MS) {
      lastRefresh.current = now;
      refreshingRef.current = true;
      setRefreshing(true);
      pullRef.current = THRESHOLD;
      setPull(THRESHOLD);
      emitGlobalRefresh();
      // Visual refresh window — pages handle their own data reload.
      setTimeout(() => {
        refreshingRef.current = false;
        setRefreshing(false);
        pullRef.current = 0;
        setPull(0);
      }, 900);
    } else {
      pullRef.current = 0;
      setPull(0);
    }
    startY.current = null;
  }, []);

  useEffect(() => {
    if (reduce) return;
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [onTouchStart, onTouchMove, onTouchEnd, reduce]);

  if (reduce) return null;

  const progress = Math.min(pull / THRESHOLD, 1);

  return (
    <div
      className="fixed top-0 inset-x-0 z-[60] flex justify-center pointer-events-none"
      style={{ height: pull, transition: pull === 0 || refreshing ? 'height 0.32s cubic-bezier(0.22,1,0.36,1)' : 'none' }}
    >
      <AnimatePresence>
        {(pull > 4 || refreshing) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: progress, scale: 0.6 + progress * 0.4 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.2 }}
            className="relative flex items-center justify-center w-12 h-12 mt-2 rounded-full shadow-lg"
            style={{ background: 'linear-gradient(135deg, #2F1C8F 0%, #6C63FF 100%)' }}
          >
            <div className="absolute inset-0 rounded-full bg-primary/40 blur-md" aria-hidden="true" />
            <motion.div
              animate={refreshing ? { scale: [1, 1.15, 1], rotate: [0, 10, 0] } : {}}
              transition={refreshing ? { duration: 1, repeat: Infinity, ease: 'easeInOut' } : {}}
              className="relative"
              style={{ transform: refreshing ? undefined : `rotate(${progress * 270}deg)` }}
            >
              <Sparkles className="w-5 h-5 text-white" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}