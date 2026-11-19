import NativePhotoInput from '@/components/media/NativePhotoInput';
import React, { useRef, useState } from 'react';
import { Camera, ImagePlus, Upload, RefreshCw, Trash2, Loader2, RotateCw } from 'lucide-react';
import { pickCoverImage, uploadCoverImage, isNativeCameraAvailable } from '@/lib/cover-image-upload';
import { validateImageFile } from '@/lib/upload-security';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function StepPhotos({ data, update }) {
  const { t } = useLocalization();
  const fileRef = useRef(null);
  const cameraRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [localPreview, setLocalPreview] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [pendingFile, setPendingFile] = useState(null);

  const cover = localPreview || data.coverPhoto;

  const runUpload = async (file) => {
    setUploadError('');
    setUploading(true);
    try {
      const url = await uploadCoverImage(file);
      update('coverPhoto', url);
      setPendingFile(null);
      setLocalPreview((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
    } catch (e) {
      setUploadError(e?.message || "We couldn't upload your cover photo. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleFile = async (file) => {
    if (!file) return;
    const v = validateImageFile(file, { maxMb: 5 });
    if (!v.ok) { setUploadError(v.error); return; }
    setLocalPreview((prev) => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(file); });
    setPendingFile(file);
    await runUpload(file);
  };

  const openPicker = async (source) => {
    setUploadError('');
    if (!isNativeCameraAvailable()) {
      (source === 'camera' ? cameraRef : fileRef).current?.click();
      return;
    }
    try {
      const file = await pickCoverImage(source);
      if (file) await handleFile(file);
    } catch (e) {
      setUploadError(e?.message || "We couldn't open your photo library.");
    }
  };

  const onFileSelect = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) handleFile(file);
  };

  const removeCover = () => {
    update('coverPhoto', null);
    setLocalPreview((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
    setPendingFile(null);
    setUploadError('');
  };

  return (
    <div className="space-y-5">
      <div className="text-center mb-2">
        <h2 className="text-lg font-semibold">{t('experiences.edit.cover_photo')}</h2>
        <p className="text-sm text-muted-foreground">{t('hosting.step_photos.capture_vibe')}</p>
      </div>

      <div className="relative aspect-video rounded-2xl overflow-hidden border-2 border-dashed border-border">
        {cover ? (
          <>
            <img src={cover} alt={t('hosting.wizard.step_cover')} className="w-full h-full object-cover" />
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            )}
            {!uploading && (
              <div className="absolute bottom-0 start-0 end-0 flex gap-2 p-2 bg-gradient-to-t from-black/60 to-transparent">
                <button onClick={() => openPicker('gallery')} type="button"
                  className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg bg-background/90 backdrop-blur text-xs font-medium hover:bg-background transition-default">
                  <RefreshCw className="w-3.5 h-3.5" /> {t('hosting.photos.change_cover')}
                </button>
                <button onClick={removeCover} type="button"
                  className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg bg-background/90 backdrop-blur text-xs font-medium text-destructive hover:bg-background transition-default">
                  <Trash2 className="w-3.5 h-3.5" /> {t('hosting.photos.remove_cover')}
                </button>
              </div>
            )}
          </>
        ) : (
          <button onClick={() => openPicker('gallery')} type="button" disabled={uploading}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:bg-muted/30 transition-default disabled:opacity-50">
            {uploading ? <Loader2 className="w-10 h-10 animate-spin" /> : <ImagePlus className="w-10 h-10" />}
            <p className="text-xs">{uploading ? 'Uploading…' : 'Tap to upload a cover photo'}</p>
          </button>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center">{t('hosting.photos.aspect_ratio')}</p>

      {uploadError && (
        <div role="alert" className="flex flex-col items-center gap-2">
          <p className="text-sm text-destructive text-center" data-testid="cover-upload-error">{uploadError}</p>
          {pendingFile && (
            <button type="button" onClick={() => runUpload(pendingFile)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium">
              <RotateCw className="w-3.5 h-3.5" /> {t('common.retry')}
            </button>
          )}
        </div>
      )}

      {!cover && !uploading && (
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => openPicker('gallery')} type="button"
            className="flex items-center justify-center gap-2 h-12 rounded-xl border border-border text-sm font-medium hover:bg-muted/40 transition-default">
            <Upload className="w-4 h-4 text-primary" /> {t('common.upload')}
          </button>
          <button onClick={() => openPicker('camera')} type="button"
            className="flex items-center justify-center gap-2 h-12 rounded-xl border border-border text-sm font-medium hover:bg-muted/40 transition-default">
            <Camera className="w-4 h-4 text-primary" /> {t('circles.inmood_actions.camera')}
          </button>
        </div>
      )}
      <NativePhotoInput ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileSelect} />
      <NativePhotoInput ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFileSelect} />
    </div>
  );
}