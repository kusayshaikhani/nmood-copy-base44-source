import React, { useState, useRef } from 'react';
import { Plus, X, Loader2, ChevronLeft, ChevronRight, Camera, Image as ImageIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { updateMemberProfile } from '@/lib/member-update';
import { useToast } from '@/components/ui/use-toast';
import BottomSheet from '@/components/shared/BottomSheet';
import { useLocalization } from '@/lib/i18n/useLocalization';

const MAX_PHOTOS = 6;

function PhotoGallery({ member, onSaved }) {
  const photos = member?.photo_gallery || [];
  const { toast } = useToast();
  const { t } = useLocalization();
  const [uploading, setUploading] = useState(false);
  const [replaceIndex, setReplaceIndex] = useState(null);
  const [showSheet, setShowSheet] = useState(false);
  const [activeSlot, setActiveSlot] = useState(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

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
    setShowSheet(false);
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      let newGallery;
      if (replaceIndex !== null) {
        newGallery = [...photos];
        newGallery[replaceIndex] = file_url;
      } else if (activeSlot !== null) {
        newGallery = [...photos];
        newGallery[activeSlot] = file_url;
      } else {
        newGallery = [...photos, file_url];
      }
      await persist(newGallery);
      setReplaceIndex(null);
      setActiveSlot(null);
    } catch {
      toast({ title: t('profile.photos.upload_error_title'), description: t('profile.photos.upload_error_desc') });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleRemove = async (index) => {
    const newGallery = photos.filter((_, i) => i !== index);
    await persist(newGallery);
  };

  const handleMove = async (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= photos.length) return;
    const newGallery = [...photos];
    [newGallery[index], newGallery[newIndex]] = [newGallery[newIndex], newGallery[index]];
    await persist(newGallery);
  };

  const openAddSheet = (slotIndex) => {
    setReplaceIndex(null);
    setActiveSlot(slotIndex);
    setShowSheet(true);
  };

  const openReplaceSheet = (index) => {
    setReplaceIndex(index);
    setActiveSlot(null);
    setShowSheet(true);
  };

  const slots = Array.from({ length: MAX_PHOTOS }, (_, i) => photos[i] || null);

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold">{t('profile.photos.title')}</h2>
        <span className="text-xs text-muted-foreground">{t('profile.photos.count', { count: photos.length, max: MAX_PHOTOS })}</span>
      </div>

      {photos.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
            <ImageIcon className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground mb-4">{t('profile.photos.empty', { max: MAX_PHOTOS })}</p>
        </div>
      ) : null}

      <div className="grid grid-cols-3 gap-2 mb-4">
        {slots.map((photo, i) => (
          <div key={i} className="relative group aspect-square rounded-xl overflow-hidden bg-muted/40 border border-border">
            {photo ? (
              <>
                <img src={photo} alt={t('profile.photos.photo_n', { n: i + 1 })} loading="lazy" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-default flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                  <button onClick={() => openReplaceSheet(i)} className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center" type="button">
                    <Camera className="w-3.5 h-3.5 text-foreground" />
                  </button>
                  <button onClick={() => handleMove(i, -1)} disabled={i === 0} className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center disabled:opacity-30" type="button">
                    <ChevronLeft className="w-3.5 h-3.5 text-foreground" />
                  </button>
                  <button onClick={() => handleMove(i, 1)} disabled={i === photos.length - 1} className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center disabled:opacity-30" type="button">
                    <ChevronRight className="w-3.5 h-3.5 text-foreground" />
                  </button>
                  <button onClick={() => handleRemove(i)} className="w-7 h-7 rounded-full bg-destructive flex items-center justify-center" type="button">
                    <X className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              </>
            ) : (
              <button onClick={() => openAddSheet(i)} className="w-full h-full flex flex-col items-center justify-center gap-1 hover:bg-muted transition-default" type="button">
                {uploading ? <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /> : (
                  <>
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <Plus className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <span className="text-[10px] text-muted-foreground">{t('profile.photos.add')}</span>
                  </>
                )}
              </button>
            )}
          </div>
        ))}
      </div>

      {photos.length < MAX_PHOTOS && (
        <Button size="sm" className="w-full gap-2" disabled={uploading} onClick={() => openAddSheet(null)}>
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          {t('profile.photos.add')}
        </Button>
      )}

      <BottomSheet open={showSheet} onOpenChange={setShowSheet} title={t('profile.photos.add')}>
        <div className="space-y-1 pb-2">
          <button onClick={() => cameraInputRef.current?.click()} className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-muted transition-default" type="button">
            <Camera className="w-5 h-5 text-primary" /><span className="text-sm font-medium">{t('profile.photos.take')}</span>
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-muted transition-default" type="button">
            <ImageIcon className="w-5 h-5 text-primary" /><span className="text-sm font-medium">{t('profile.photos.gallery')}</span>
          </button>
        </div>
      </BottomSheet>

      <input ref={cameraInputRef} type="file" accept="image/*" capture="user" className="hidden" onChange={handleFileSelect} />
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
    </Card>
  );
}

export default React.memo(PhotoGallery);