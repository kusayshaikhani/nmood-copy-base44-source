import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

/**
 * DS-014 — Full-screen photo viewer for Premium members.
 * Swipe between photos, pinch to zoom, double-tap to zoom, keyboard nav,
 * close button, lazy-loaded images, and screen-reader labels.
 */
export default function PhotoViewer({ open, photos, index: startIndex = 0, onClose }) {
  const [index, setIndex] = useState(startIndex);
  const [scale, setScale] = useState(1);
  const pinch = useRef(null);
  const { t } = useLocalization();

  useEffect(() => { setIndex(startIndex); setScale(1); }, [startIndex, open]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  });

  const count = photos?.length || 0;
  const next = useCallback(() => { setScale(1); setIndex((i) => (i + 1) % count); }, [count]);
  const prev = useCallback(() => { setScale(1); setIndex((i) => (i - 1 + count) % count); }, [count]);

  if (!open || count === 0) return null;

  const onDragEnd = (_, info) => {
    if (scale > 1) return;
    if (info.offset.x < -80) next();
    else if (info.offset.x > 80) prev();
  };

  const onTouchStart = (e) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinch.current = { dist: Math.hypot(dx, dy), scale };
    }
  };
  const onTouchMove = (e) => {
    if (e.touches.length === 2 && pinch.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const s = Math.min(Math.max(1, pinch.current.scale * (Math.hypot(dx, dy) / pinch.current.dist)), 4);
      setScale(s);
    }
  };
  const onTouchEnd = () => { pinch.current = null; if (scale <= 1.05) setScale(1); };
  const doubleTap = () => setScale((s) => (s > 1 ? 1 : 2));

  return (
    <div
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center select-none"
      role="dialog"
      aria-modal="true"
      aria-label={t('discovery.photo.aria.viewer')}
    >
      <button onClick={onClose} aria-label={t('discovery.photo.aria.close')} className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white">
        <X className="w-5 h-5" />
      </button>
      {count > 1 && (
        <>
          <button onClick={prev} aria-label={t('discovery.photo.aria.previous')} className="absolute left-3 z-10 w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={next} aria-label={t('discovery.photo.aria.next')} className="absolute right-3 z-10 w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white">
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      <motion.img
        key={index}
        src={photos[index]}
        alt={t('discovery.photo.alt', { n: index + 1, total: count })}
        loading="lazy"
        draggable={false}
        drag={scale > 1}
        dragConstraints={{ left: -250, right: 250, top: -250, bottom: 250 }}
        dragElastic={0.2}
        onDragEnd={onDragEnd}
        onClick={doubleTap}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, scale }}
        transition={{ type: 'spring', stiffness: 220, damping: 26 }}
        className="max-w-full max-h-full object-contain touch-none cursor-grab active:cursor-grabbing"
      />

      {count > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5">
          {photos.map((_, i) => (
            <span key={i} className={'h-1.5 rounded-full transition-all ' + (i === index ? 'w-5 bg-white' : 'w-1.5 bg-white/40')} />
          ))}
        </div>
      )}
    </div>
  );
}