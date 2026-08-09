import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Loader2, ChevronLeft, ChevronRight, Camera, Image as ImageIcon, XCircle } from 'lucide-react';
import SectionReveal from '@/components/experience/SectionReveal';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { updateMemberProfile } from '@/lib/member-update';
import { useToast } from '@/components/ui/use-toast';
import BottomSheet from '@/components/shared/BottomSheet';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { normalizeGalleryItem, normalizeImageUrl } from '@/lib/gallery-normalizer';

const MAX_PHOTOS = 6;

/**
 * UI-017 — Large horizontal-scroll gallery with fullscreen lightbox.
 * Preserves the exact upload / replace / reorder / remove logic from the
 * original PhotoGallery — only the presentation is redesigned.
 */
export default function ProfileGallery({ member, onSaved }) {
  const rawPhotos = member?.photo_gallery || [];
  const { toast } = useToast();
  const { t } = useLocalization();
  const [uploading, setUploading] = useState(false);
  const [replaceIndex, setReplaceIndex] = useState(null);
  const [activeSlot, setActiveSlot] = useState(null);
  const [showSheet, setShowSheet] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [failedThumbs, setFailedThumbs] = useState({});
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Normalize raw gallery entries into valid items. Invalid entries are
  // filtered out so they never render a broken-image icon. The lightbox
  // and thumbnails both read from this same normalized list.
  const photos = rawPhotos
    .map((entry, i) => normalizeGalleryItem(entry, i, member?.display_name || ''))
    .filter(Boolean);
  const photoSrcs = photos.map((p) => p.src);

  const persist = async (newGallery) => {
    if (!member?.id) return;
    try {
      const updated = await updateMemberProfile({ photo_gallery: newGallery });
      onSaved?.(updated);
    } catch {
      toast({ title: t('profile.photos.save_error_title'), description: t('profile.photos.save_error_desc') });
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reject unsupported types and oversized files (>10 MB).
    if (!file.type.startsWith('image/')) {
      toast({ title: t('profile.photos.upload_error_title'), description: 'Please choose an image file.' });
      e.target.value = '';
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: t('profile.photos.upload_error_title'), description: 'Image must be under 10 MB.' });
      e.target.value = '';
      return;
    }
    setShowSheet(false);
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const normalized = normalizeImageUrl(file_url);
      if (!normalized) throw new Error('Upload returned an invalid URL');
      let newGallery;
      if (replaceIndex !== null) { newGallery = [...photoSrcs]; newGallery[replaceIndex] = normalized; }
      else if (activeSlot !== null) { newGallery = [...photoSrcs]; newGallery[activeSlot] = normalized; }
      else { newGallery = [...photoSrcs, normalized]; }
      await persist(newGallery);
      setReplaceIndex(null); setActiveSlot(null);
      setFailedThumbs({});
    } catch {
      toast({ title: t('profile.photos.upload_error_title'), description: t('profile.photos.upload_error_desc') });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleRemove = async (index) => {
    const newGallery = photoSrcs.filter((_, i) => i !== index);
    await persist(newGallery);
    setLightboxIndex(null);
    setFailedThumbs({});
  };

  const handleMove = async (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= photoSrcs.length) return;
    const newGallery = [...photoSrcs];
    [newGallery[index], newGallery[newIndex]] = [newGallery[newIndex], newGallery[index]];
    await persist(newGallery);
  };

  const openAddSheet = (slotIndex) => { setReplaceIndex(null); setActiveSlot(slotIndex); setShowSheet(true); };
  const openReplaceSheet = (index) => { setReplaceIndex(index); setActiveSlot(null); setShowSheet(true); };
  const slots = Array.from({ length: MAX_PHOTOS }, (_, i) => photos[i] || null);
  const isOpen = lightboxIndex !== null;

  return (
    <SectionReveal>
      <div className="px-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-section-title font-semibold">{t('profile.premium.gallery.title')}</h2>
          <span className="text-xs text-muted-foreground">{t('profile.premium.gallery.count', { count: photos.length, max: MAX_PHOTOS })}</span>
        </div>

        {photos.length === 0 && (
          <div className="text-center py-10 rounded-card border border-dashed border-border/60 bg-muted/20">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
              <ImageIcon className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mb-4 px-6">{t('profile.premium.gallery.empty', { max: MAX_PHOTOS })}</p>
            <Button size="sm" className="gap-2" disabled={uploading} onClick={() => openAddSheet(null)}>
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {t('profile.premium.gallery.add')}
            </Button>
          </div>
        )}

        {photos.length > 0 && (
          <div className="flex gap-3 overflow-x-auto no-scrollbar overscroll-x-contain snap-x snap-mandatory -mx-6 px-6 pb-1">
            {slots.map((photo, i) => (
              <div key={photo?.id || `slot-${i}`} className="relative flex-shrink-0 w-40 h-40 snap-start rounded-card overflow-hidden bg-muted/40 border border-border group pressable">
                {photo ? (
                  <>
                    {failedThumbs[i] ? (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <ImageIcon className="w-7 h-7" />
                      </div>
                    ) : (
                      <img
                        src={photo.thumbnailSrc}
                        alt={photo.alt}
                        loading="lazy"
                        className="w-full h-full object-cover"
                        onError={() => setFailedThumbs((p) => ({ ...p, [i]: true }))}
                      />
                    )}
                    <button type="button" onClick={() => setLightboxIndex(i)} className="absolute inset-0 z-10" aria-label={photo.alt} />
                    <div className="absolute bottom-2 right-2 z-20 flex gap-1">
                      <button onClick={() => openReplaceSheet(i)} className="w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm" type="button">
                        <Camera className="w-3.5 h-3.5 text-foreground" />
                      </button>
                      <button onClick={() => handleRemove(i)} className="w-7 h-7 rounded-full bg-destructive flex items-center justify-center shadow-sm" type="button">
                        <X className="w-3.5 h-3.5 text-white" />
                      </button>
                    </div>
                  </>
                ) : (
                  <button onClick={() => openAddSheet(i)} className="w-full h-full flex flex-col items-center justify-center gap-1 hover:bg-muted transition-default" type="button">
                    {uploading ? <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /> : (
                      <>
                        <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center"><Plus className="w-4 h-4 text-muted-foreground" /></div>
                        <span className="text-[10px] text-muted-foreground">{t('profile.premium.gallery.add')}</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {photos.length < MAX_PHOTOS && photos.length > 0 && (
          <Button size="sm" variant="outline" className="w-full mt-3 gap-2" disabled={uploading} onClick={() => openAddSheet(null)}>
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {t('profile.premium.gallery.add')}
          </Button>
        )}
      </div>

      {/* Fullscreen lightbox — uses the same normalized items as the thumbnails. */}
      <AnimatePresence>
        {isOpen && photos[lightboxIndex] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center"
            onClick={() => setLightboxIndex(null)}
          >
            <button className="absolute top-[calc(env(safe-area-inset-top)+1rem)] right-4 w-10 h-10 rounded-full bg-white/15 flex items-center justify-center" type="button" onClick={() => setLightboxIndex(null)} aria-label="Close">
              <XCircle className="w-6 h-6 text-white" />
            </button>
            {lightboxIndex > 0 && (
              <button className="absolute left-4 w-10 h-10 rounded-full bg-white/15 flex items-center justify-center" type="button" onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => Math.max(0, i - 1)); }} aria-label="Previous">
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>
            )}
            {lightboxIndex < photos.length - 1 && (
              <button className="absolute right-4 w-10 h-10 rounded-full bg-white/15 flex items-center justify-center" type="button" onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => Math.min(photos.length - 1, i + 1)); }} aria-label="Next">
                <ChevronRight className="w-6 h-6 text-white" />
              </button>
            )}
            <img
              src={photos[lightboxIndex].src}
              alt={photos[lightboxIndex].alt}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            {photos.length > 1 && (
              <div className="absolute bottom-[calc(env(safe-area-inset-bottom)+1.5rem)] flex gap-2" onClick={(e) => e.stopPropagation()}>
                <button className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center" type="button" onClick={() => handleMove(lightboxIndex, -1)} aria-label="Move left"><ChevronLeft className="w-5 h-5 text-white" /></button>
                <button className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center" type="button" onClick={() => handleMove(lightboxIndex, 1)} aria-label="Move right"><ChevronRight className="w-5 h-5 text-white" /></button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <BottomSheet open={showSheet} onOpenChange={setShowSheet} title={t('profile.premium.gallery.add')}>
        <div className="space-y-1 pb-2">
          <button onClick={() => cameraInputRef.current?.click()} className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-muted transition-default" type="button">
            <Camera className="w-5 h-5 text-primary" /><span className="text-sm font-medium">{t('profile.premium.gallery.take')}</span>
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-muted transition-default" type="button">
            <ImageIcon className="w-5 h-5 text-primary" /><span className="text-sm font-medium">{t('profile.premium.gallery.choose')}</span>
          </button>
        </div>
      </BottomSheet>

      <input ref={cameraInputRef} type="file" accept="image/*" capture="user" className="hidden" onChange={handleFileSelect} />
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
    </SectionReveal>
  );
}