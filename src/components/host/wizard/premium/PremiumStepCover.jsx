import React, { useRef, useState, useEffect } from 'react';
import { Camera, ImagePlus, RefreshCw, Trash2, Loader2, Sparkles, RotateCw } from 'lucide-react';
import { pickCoverImage, uploadCoverImage, isNativeCameraAvailable } from '@/lib/cover-image-upload';
import { validateImageFile } from '@/lib/upload-security';
import { useLocalization } from '@/lib/i18n/useLocalization';
import SuggestedCoverThumb from '@/components/host/wizard/shared/SuggestedCoverThumb';

const suggestedCovers = [
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600',
  'https://images.unsplash.com/photo-1606914502047-4728c0cbd3cc?w=600',
  'https://images.unsplash.com/photo-1452587925148-ce54479dab4e?w=600',
  'https://images.unsplash.com/photo-1515464039244-8b30a80c5c5f?w=600',
  'https://images.unsplash.com/photo-1593810451137-5dc55705239d?w=600',
  'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600',
];

/**
 * UI-020 — Step 1: Cover photo upload.
 * 16:9 preview, 28px rounded, camera/gallery/replace, suggested covers.
 */
export default function PremiumStepCover({ data, update }) {
  const { t } = useLocalization();
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [preview, setPreview] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);

  // Revoke the object URL when the local preview is replaced or unmounted.
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const cover = preview || data.coverPhoto;

  const runUpload = async (file) => {
    setUploadError('');
    setUploading(true);
    setProgress(0);
    // The wizard cannot advance while coverUploading is true.
    update('coverUploading', true);
    try {
      const url = await uploadCoverImage(file, { onProgress: setProgress });
      update('coverPhoto', url);
      setPendingFile(null);
    } catch (err) {
      setUploadError(err?.message || "We couldn't upload your cover photo.");
    } finally {
      setUploading(false);
      update('coverUploading', false);
    }
  };

  const startUpload = async (file) => {
    if (!file) return;
    const v = validateImageFile(file, { maxMb: 5 });
    if (!v.ok) { setUploadError(v.error); return; }
    // Show the picked image immediately, before the network round-trip.
    setPreview((prev) => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(file); });
    setImgLoaded(false);
    setPendingFile(file);
    await runUpload(file);
  };

  const handleNativePick = async (source) => {
    setUploadError('');
    try {
      const file = await pickCoverImage(source);
      if (file) await startUpload(file);
    } catch (err) {
      setUploadError(err?.message || "We couldn't open your photo library.");
    }
  };

  const openPicker = (source) => {
    if (isNativeCameraAvailable()) { handleNativePick(source); return; }
    fileRef.current?.click();
  };

  const onFileSelect = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) startUpload(file);
  };

  const clearCover = () => {
    setPreview((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
    setPendingFile(null);
    setUploadError('');
    setImgLoaded(false);
    update('coverPhoto', null);
  };

  const selectSuggested = (img) => {
    setPreview((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
    setPendingFile(null);
    setUploadError('');
    setImgLoaded(false);
    update('coverPhoto', img);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-2">
        <h2 className="text-2xl font-bold">{t('hosting.step_photos.title')}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t('hosting.step_photos.capture_vibe')}</p>
      </div>

      {/* Upload zone */}
      <div className="relative aspect-video rounded-card overflow-hidden border-2 border-dashed border-border/60 shadow-card">
        {cover ? (
          <>
            <img
              src={cover}
              alt=""
              onLoad={() => setImgLoaded(true)}
              className={`w-full h-full object-cover transition-opacity duration-500 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            />
            {!imgLoaded && !uploading && <div className="absolute inset-0 shimmer" />}
            {uploading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/50 px-8">
                <Loader2 className="w-7 h-7 text-white animate-spin" />
                <div className="w-full h-1.5 rounded-full bg-white/25 overflow-hidden">
                  <div className="h-full bg-white transition-[width] duration-200" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-xs font-medium text-white" data-testid="cover-upload-progress">
                  {t('hosting.photos.uploading_progress', { percent: progress })}
                </p>
              </div>
            )}
            {!uploading && (
              <div className="absolute bottom-0 start-0 end-0 flex gap-2 p-3 bg-gradient-to-t from-black/60 to-transparent">
                <button onClick={() => openPicker('gallery')} type="button"
                  className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-button bg-white/90 backdrop-blur text-xs font-medium active:scale-95 transition-transform">
                  <RefreshCw className="w-3.5 h-3.5" /> {t('hosting.photos.change_cover')}
                </button>
                <button onClick={clearCover} type="button"
                  className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-button bg-white/90 backdrop-blur text-xs font-medium text-destructive active:scale-95 transition-transform">
                  <Trash2 className="w-3.5 h-3.5" /> {t('hosting.photos.remove_cover')}
                </button>
              </div>
            )}
          </>
        ) : (
          <button onClick={() => openPicker('gallery')} type="button" disabled={uploading}
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground hover:bg-muted/30 transition-colors disabled:opacity-50">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <ImagePlus className="w-8 h-8 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">{t('hosting.step_photos.upload')}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t('hosting.photos.aspect_ratio')}</p>
            </div>
          </button>
        )}
      </div>

      {uploadError && (
        <div role="alert" className="flex flex-col items-center gap-2">
          <p className="text-sm text-destructive text-center" data-testid="cover-upload-error">{uploadError}</p>
          {pendingFile && (
            <button type="button" onClick={() => runUpload(pendingFile)}
              className="inline-flex items-center gap-1.5 rounded-button border border-border px-3 py-1.5 text-xs font-medium active:scale-95 transition-transform">
              <RotateCw className="w-3.5 h-3.5" /> {t('common.retry')}
            </button>
          )}
        </div>
      )}

      {/* Upload options */}
      {!cover && !uploading && (
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => openPicker('gallery')} type="button"
            className="flex items-center justify-center gap-2 h-12 rounded-button border border-border text-sm font-medium hover:bg-muted/50 active:scale-95 transition-all">
            <ImagePlus className="w-4 h-4 text-primary" /> {t('common.upload')}
          </button>
          <button onClick={() => openPicker('camera')} type="button"
            className="flex items-center justify-center gap-2 h-12 rounded-button border border-border text-sm font-medium hover:bg-muted/50 active:scale-95 transition-all">
            <Camera className="w-4 h-4 text-primary" /> {t('circles.inmood_actions.camera')}
          </button>
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileSelect} />

      {/* Suggested covers */}
      <div>
        <p className="text-sm font-medium mb-3 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-primary" /> {t('hosting.photos.suggested_covers')}
        </p>
        <div className="flex gap-3 overflow-x-auto no-scrollbar overscroll-x-contain snap-x snap-mandatory pb-1">
          {suggestedCovers.map((img) => (
            <SuggestedCoverThumb
              key={img}
              src={img}
              selected={data.coverPhoto === img}
              onSelect={() => selectSuggested(img)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}