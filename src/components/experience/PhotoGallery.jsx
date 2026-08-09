import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import SmartImage from '@/components/shared/SmartImage';
import { useLocalization } from '@/lib/i18n/useLocalization';

/**
 * Nmood Premium gallery — horizontal snap-scrolling images with rounded
 * corners; tap to open a fullscreen lightbox.
 */
export default function PhotoGallery({ experience }) {
  const { t } = useLocalization();
  const { gallery, title } = experience;
  const images = Array.isArray(gallery) ? gallery.filter(Boolean) : [];
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setLightbox(null);
      if (e.key === 'ArrowRight') setLightbox((i) => (i + 1) % images.length);
      if (e.key === 'ArrowLeft') setLightbox((i) => (i - 1 + images.length) % images.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox, images.length]);

  if (!images.length) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-section-title text-foreground">{t('experiences.gallery.title')}</h2>
      <div className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory momentum-scroll -mx-4 px-4 sm:mx-0 sm:px-0 pb-2">
        {images.map((img, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setLightbox(i)}
            className="pressable snap-start shrink-0 w-56 h-40 rounded-[20px] overflow-hidden border border-border/50 shadow-card"
          >
            <SmartImage src={img} alt={`${title} ${i + 1}`} rounded="rounded-none" className="w-full h-full" />
          </button>
        ))}
      </div>

      <AnimatePresence>
        {lightbox !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center"
            onClick={() => setLightbox(null)}
          >
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setLightbox(null); }}
              className="absolute top-5 end-4 w-11 h-11 rounded-full bg-white/15 backdrop-blur flex items-center justify-center text-white"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setLightbox((i) => (i - 1 + images.length) % images.length); }}
                  className="absolute start-4 w-11 h-11 rounded-full bg-white/15 backdrop-blur flex items-center justify-center text-white"
                  aria-label="Previous"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setLightbox((i) => (i + 1) % images.length); }}
                  className="absolute end-4 w-11 h-11 rounded-full bg-white/15 backdrop-blur flex items-center justify-center text-white"
                  aria-label="Next"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            <motion.img
              key={lightbox}
              src={images[lightbox]}
              alt={`${title} ${lightbox + 1}`}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
              className="max-w-[92vw] max-h-[82vh] object-contain rounded-[24px]"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}