import React, { useState, useRef, useCallback } from 'react';
import { Loader2, AlertCircle, Camera, User, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { feedback } from '@/lib/feedback';
import { haptic } from '@/lib/haptics';
import { trackProductEvent, PRODUCT_EVENTS } from '@/lib/product-analytics';
import { processImage, IMAGE_ACCEPT } from '@/lib/image-processing';
import { validateImageFile } from '@/lib/upload-security';
import { useLocalization } from '@/lib/i18n/useLocalization';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import MediaPickerSheet from './MediaPickerSheet';
import ImageCropper from './ImageCropper';

/**
 * M-001 — Universal Media Picker.
 * The single image-upload component for InMood. Tapping the trigger opens the
 * "Change Photo" sheet → camera/gallery → crop → EXIF/compress → upload with
 * progress + one automatic retry → instant refresh via onUploaded/onRemoved.
 * Reuse this everywhere; never build a new upload flow.
 */
function DefaultTrigger({ photoUrl, onClick }) {
  return (
    <button type="button" onClick={onClick} aria-label="Change photo" className="relative">
      <span className="block w-20 h-20 rounded-full border-4 border-card shadow-lg overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
        {photoUrl ? <img src={photoUrl} alt="" className="w-full h-full object-cover" /> : <User className="w-7 h-7 text-muted-foreground" />}
      </span>
      <span className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary flex items-center justify-center border-4 border-background shadow-md">
        <Camera className="w-3.5 h-3.5 text-primary-foreground" />
      </span>
    </button>
  );
}

export default function MediaPicker({
  trigger,
  hasImage = false,
  photoUrl,
  aspect = 'square',
  maxMb = 5,
  onUploaded,
  onRemoved,
}) {
  const { t } = useLocalization();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);
  const objectUrlRef = useRef(null);
  const blobRef = useRef(null);
  const lockRef = useRef(false);

  const cleanup = () => {
    if (objectUrlRef.current) { URL.revokeObjectURL(objectUrlRef.current); objectUrlRef.current = null; }
    setImageSrc(null);
    blobRef.current = null;
  };

  const openSheet = () => { haptic('selection'); setSheetOpen(true); };

  const onPickFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const v = validateImageFile(file, { maxMb: 15 });
    if (!v.ok) { feedback.error(new Error(v.error)); return; }
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setImageSrc(url);
    setSheetOpen(false);
    setCropOpen(true);
  };

  const onCropConfirm = useCallback(async (croppedBlob) => {
    setCropOpen(false);
    let processed;
    try {
      processed = await processImage(croppedBlob, { maxMb });
    } catch {
      feedback.error(new Error('Could not process image.'));
      cleanup();
      return;
    }
    blobRef.current = processed.blob;
    await upload();
  }, [maxMb]);

  const upload = async () => {
    const blob = blobRef.current;
    if (!blob || lockRef.current) return;
    lockRef.current = true;
    setUploading(true);
    setError(false);
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        trackProductEvent(PRODUCT_EVENTS.PHOTO_UPLOADED);
        haptic('success');
        feedback.message(t('media.photo_updated'));
        onUploaded?.(file_url);
        setUploading(false);
        lockRef.current = false;
        cleanup();
        return;
      } catch {
        /* retry once */
      }
    }
    setUploading(false);
    setError(true);
    haptic('error');
    lockRef.current = false;
  };

  const doRemove = () => {
    setConfirmRemove(false);
    haptic('success');
    feedback.message(t('media.photo_removed'));
    onRemoved?.();
  };

  const triggerEl = trigger
    ? React.cloneElement(trigger, { onClick: (e) => { e.preventDefault(); if (trigger.props.onClick) trigger.props.onClick(e); openSheet(); } })
    : <DefaultTrigger photoUrl={photoUrl} onClick={openSheet} />;

  return (
    <>
      {triggerEl}

      <input ref={cameraRef} type="file" accept={IMAGE_ACCEPT} capture="environment" className="hidden" onChange={onPickFile} />
      <input ref={galleryRef} type="file" accept={IMAGE_ACCEPT} className="hidden" onChange={onPickFile} />

      <MediaPickerSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        hasImage={hasImage}
        onCamera={() => cameraRef.current?.click()}
        onGallery={() => galleryRef.current?.click()}
        onRemove={() => setConfirmRemove(true)}
      />

      <ImageCropper
        open={cropOpen}
        imageSrc={imageSrc}
        defaultAspect={aspect}
        onConfirm={onCropConfirm}
        onCancel={() => { setCropOpen(false); cleanup(); }}
      />

      {uploading && (
        <div className="fixed inset-0 z-[110] bg-background/90 backdrop-blur-sm flex flex-col items-center justify-center gap-4 px-6">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm font-medium">{t('media.uploading')}</p>
          <div className="w-48 h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full w-1/2 bg-primary rounded-full animate-pulse" />
          </div>
        </div>
      )}

      {error && (
        <div className="fixed inset-0 z-[110] bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center gap-5 px-8">
          <span className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-destructive" />
          </span>
          <p className="text-base font-semibold">{t('media.upload_failed')}</p>
          <div className="flex flex-col gap-2 w-full max-w-xs">
            <button type="button" onClick={upload} className="h-11 rounded-full bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4" /> {t('media.try_again')}
            </button>
            <button type="button" onClick={() => { setError(false); cleanup(); }} className="h-11 rounded-full border border-border text-sm font-medium">{t('common.cancel')}</button>
          </div>
        </div>
      )}

      <AlertDialog open={confirmRemove} onOpenChange={setConfirmRemove}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('media.remove_photo_title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('media.remove_photo_desc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={doRemove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t('media.remove_button')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}