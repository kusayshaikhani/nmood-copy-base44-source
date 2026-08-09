import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { normalizeGallery } from '@/lib/gallery-normalizer';

/**
 * Full-screen photo viewer for the profile gallery.
 *
 * Accepts either a raw gallery array (strings/objects) or pre-normalized
 * items — both paths go through normalizeGallery so the thumbnail and the
 * lightbox always show the same image.
 *
 * Behavior:
 *   • Clicking a thumbnail opens that exact normalized image.
 *   • Preloads the selected image + adjacent images before displaying.
 *   • Touch swipe: left = next, right = previous (deliberate threshold).
 *   • Horizontal swipes are distinguished from vertical scrolling.
 *   • Swipe does not trigger browser-back or close the lightbox.
 *   • Slide animation with a transition lock prevents rapid transitions.
 *   • Prev / next navigate only through valid normalized images.
 *   • Large arrows hidden on mobile; subtle arrows on tablet/desktop.
 *   • Pagination dots (tappable) + counter "2 / 3".
 *   • Close via button, Escape, or backdrop.
 *   • Background scrolling locked while open.
 *   • Focus restored to the trigger thumbnail after closing.
 *   • Image fits within the viewport (object-contain, no crop).
 *   • A failed image shows a clean placeholder, never the browser broken icon.
 *   • Arrows, dots, and counter hidden when only one valid image remains.
 */
const SWIPE_THRESHOLD = 50; // px — deliberate horizontal travel to trigger nav
const ANIM_MS = 300;         // transition lock duration

export default function GalleryLightbox({ photos, startIndex, open, onClose, triggerRef, displayName }) {
  const { t } = useLocalization();
  const [index, setIndex] = useState(startIndex || 0);
  const [direction, setDirection] = useState(0);   // 1 = next, -1 = prev
  const [isAnimating, setIsAnimating] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [preloaded, setPreloaded] = useState({});
  const containerRef = useRef(null);
  const closeBtnRef = useRef(null);
  const touchStart = useRef({ x: 0, y: 0, time: 0 });
  const isHorizontalSwipe = useRef(false);

  // Normalize once — invalid entries are already filtered out.
  const items = normalizeGallery(photos, displayName || '');
  const count = items.length;

  // Clamp index into valid range whenever the item list changes.
  useEffect(() => {
    setIndex((i) => {
      if (count === 0) return 0;
      return Math.min(Math.max(i, 0), count - 1);
    });
  }, [count]);

  // Reset load state when the index or item set changes.
  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [index, open, count]);

  // Preload the current image before showing it.
  useEffect(() => {
    if (!open || count === 0) return;
    const item = items[index];
    if (!item) return;
    const img = new Image();
    img.onload = () => setLoaded(true);
    img.onerror = () => { setFailed(true); setLoaded(true); };
    img.src = item.src;
  }, [open, index, count, items]);

  // Preload adjacent images for instant swipe navigation.
  useEffect(() => {
    if (!open || count <= 1) return;
    const adjacents = [index - 1, index + 1].map((i) => items[(i + count) % count]);
    adjacents.forEach((item) => {
      if (item && !preloaded[item.src]) {
        const img = new Image();
        img.src = item.src;
        setPreloaded((p) => ({ ...p, [item.src]: true }));
      }
    });
  }, [index, open, count, items, preloaded]);

  // Navigate with direction + animation lock.
  const navigate = useCallback((dir) => {
    if (isAnimating || count <= 1) return;
    setIsAnimating(true);
    setDirection(dir);
    setIndex((i) => (i + dir + count) % count);
    setTimeout(() => setIsAnimating(false), ANIM_MS);
  }, [isAnimating, count]);

  // Jump to a specific index (pagination dot tap).
  const goTo = useCallback((target) => {
    if (isAnimating || target === index) return;
    setIsAnimating(true);
    setDirection(target > index ? 1 : -1);
    setIndex(target);
    setTimeout(() => setIsAnimating(false), ANIM_MS);
  }, [isAnimating, index]);

  const handleClose = useCallback(() => { onClose?.(); }, [onClose]);

  // Keyboard nav + scroll lock + focus management.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); handleClose(); }
      else if (e.key === 'ArrowLeft' && count > 1) { e.preventDefault(); navigate(-1); }
      else if (e.key === 'ArrowRight' && count > 1) { e.preventDefault(); navigate(1); }
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeBtnRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      if (triggerRef?.current) triggerRef.current.focus();
    };
  }, [open, count, navigate, handleClose, triggerRef]);

  // ── Touch swipe handlers ──────────────────────────────────────────────
  const onTouchStart = (e) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY, time: Date.now() };
    isHorizontalSwipe.current = false;
  };

  const onTouchMove = (e) => {
    const t = e.touches[0];
    const deltaX = t.clientX - touchStart.current.x;
    const deltaY = t.clientY - touchStart.current.y;
    // Once horizontal intent is confirmed, prevent scrolling / browser-back.
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      isHorizontalSwipe.current = true;
      e.preventDefault();
    }
  };

  const onTouchEnd = (e) => {
    if (!isHorizontalSwipe.current) return;
    const t = e.changedTouches[0];
    const deltaX = t.clientX - touchStart.current.x;
    const deltaY = t.clientY - touchStart.current.y;
    // Deliberate threshold + horizontal dominant → navigate.
    if (Math.abs(deltaX) > SWIPE_THRESHOLD && Math.abs(deltaX) > Math.abs(deltaY)) {
      navigate(deltaX < 0 ? 1 : -1); // swipe left = next, swipe right = prev
    }
    isHorizontalSwipe.current = false;
  };

  if (!open || count === 0) return null;

  const current = items[index];
  const showNav = count > 1;
  const slideClass = direction > 0 ? 'lb-slide-left' : 'lb-slide-right';

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center animate-fade-in"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label={t('profile.public.gallery_title')}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <button
        ref={closeBtnRef}
        type="button"
        onClick={handleClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-default z-20"
        aria-label="Close"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Image area — swipe target covers the full viewport. */}
      <div
        className="relative w-full h-full flex items-center justify-center p-4 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {!loaded && (
          <div className="flex flex-col items-center gap-3 text-white/60">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}
        {loaded && failed && (
          <div className="flex flex-col items-center gap-3 text-white/50">
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
              <ImageIcon className="w-8 h-8" />
            </div>
            <p className="text-sm">Image unavailable</p>
          </div>
        )}
        {loaded && !failed && current && (
          <img
            key={index}
            src={current.src}
            alt={current.alt}
            className={`max-w-full max-h-full object-contain ${slideClass}`}
            onClick={(e) => e.stopPropagation()}
            onError={() => setFailed(true)}
            draggable={false}
          />
        )}
      </div>

      {showNav && (
        <>
          {/* Arrows — hidden on mobile (swipe is primary), visible on tablet/desktop. */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); navigate(-1); }}
            className="hidden sm:flex absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 items-center justify-center text-white hover:bg-white/20 transition-default"
            aria-label="Previous"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); navigate(1); }}
            className="hidden sm:flex absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 items-center justify-center text-white hover:bg-white/20 transition-default"
            aria-label="Next"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Pagination dots + counter — tappable, active position obvious. */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              {items.map((item, i) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); goTo(i); }}
                  className={`w-2 h-2 rounded-full transition-default ${
                    i === index ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/60'
                  }`}
                  aria-label={`Photo ${i + 1}`}
                  aria-current={i === index ? 'true' : 'false'}
                />
              ))}
            </div>
            <span className="text-white/70 text-xs font-medium tabular-nums">
              {index + 1} / {count}
            </span>
          </div>
        </>
      )}
    </div>
  );
}