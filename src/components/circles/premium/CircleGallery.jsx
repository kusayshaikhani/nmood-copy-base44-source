import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Camera } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

/**
 * Premium horizontal-snap gallery with fullscreen lightbox.
 * Sources photos from circle.recent_memories (type === 'photo') and falls back
 * to experience cover images when no memories are recorded.
 */
export default function CircleGallery({ circle }) {
  const { t } = useLocalization();
  const photos = [
    ...((circle.recent_memories || []).filter((m) => m.type === 'photo').map((m) => ({ url: m.url, caption: m.caption, date: m.date }))),
    ...((circle.past_experiences || []).filter((e) => e.image).map((e) => ({ url: e.image, caption: e.title, date: e.date }))),
    ...((circle.upcoming_experiences || []).filter((e) => e.image).map((e) => ({ url: e.image, caption: e.title, date: e.date }))),
  ];

  const [lightboxIndex, setLightboxIndex] = useState(null);
  const isOpen = lightboxIndex !== null;

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowRight') setLightboxIndex((i) => (i === null ? null : Math.min(photos.length - 1, i + 1)));
      if (e.key === 'ArrowLeft') setLightboxIndex((i) => (i === null ? null : Math.max(0, i - 1)));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, photos.length]);

  if (photos.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5">
        <Camera className="w-4 h-4 text-primary" />
        <h2 className="text-section-title font-semibold">{t('circles.detail.gallery')}</h2>
      </div>
      <div className="flex gap-3 overflow-x-auto no-scrollbar overscroll-x-contain snap-x snap-mandatory -mx-4 px-4 pb-1">
        {photos.map((p, i) => (
          <motion.button
            key={i}
            type="button"
            onClick={() => setLightboxIndex(i)}
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: i * 0.04 }}
            className="snap-start flex-shrink-0 w-44 h-56 rounded-[20px] overflow-hidden bg-muted shadow-soft pressable relative group"
          >
            <img src={p.url} alt={p.caption || ''} className="w-full h-full object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
            {p.caption && (
              <div className="absolute bottom-0 inset-x-0 p-3">
                <p className="text-xs font-medium text-white line-clamp-2">{p.caption}</p>
                {p.date && <p className="text-[10px] text-white/70 mt-0.5">{p.date}</p>}
              </div>
            )}
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center"
            onClick={() => setLightboxIndex(null)}
          >
            <button type="button" className="absolute top-[max(1rem,env(safe-area-inset-top))] end-4 w-11 h-11 rounded-full bg-white/10 text-white flex items-center justify-center" onClick={(e) => { e.stopPropagation(); setLightboxIndex(null); }} aria-label="Close">
              <X className="w-5 h-5" />
            </button>
            {lightboxIndex > 0 && (
              <button type="button" className="absolute start-4 w-11 h-11 rounded-full bg-white/10 text-white flex items-center justify-center" onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => Math.max(0, i - 1)); }} aria-label="Previous">
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            {lightboxIndex < photos.length - 1 && (
              <button type="button" className="absolute end-4 w-11 h-11 rounded-full bg-white/10 text-white flex items-center justify-center" onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => Math.min(photos.length - 1, i + 1)); }} aria-label="Next">
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
            <motion.img
              key={lightboxIndex}
              src={photos[lightboxIndex].url}
              alt={photos[lightboxIndex].caption || ''}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
              className="max-w-[90vw] max-h-[80vh] object-contain rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute bottom-[max(1.5rem,env(safe-area-inset-bottom))] inset-x-0 text-center px-6">
              {photos[lightboxIndex].caption && <p className="text-sm text-white/90">{photos[lightboxIndex].caption}</p>}
              <p className="text-xs text-white/50 mt-1">{lightboxIndex + 1} / {photos.length}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}