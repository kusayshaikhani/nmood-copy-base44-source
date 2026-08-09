import React, { useRef, useState } from 'react';
import { Camera, ImagePlus, RefreshCw, Trash2, Loader2, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
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
  const cameraRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const cover = data.coverPhoto;

  const handleFile = async (file) => {
    if (!file) return;
    const v = validateImageFile(file);
    if (!v.ok) { setUploadError(v.error); return; }
    setUploadError('');
    setUploading(true);
    setImgLoaded(false);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      update('coverPhoto', file_url);
    } catch {
      setUploadError("We couldn't upload your cover photo. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const onFileSelect = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) handleFile(file);
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
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            )}
            {!uploading && (
              <div className="absolute bottom-0 start-0 end-0 flex gap-2 p-3 bg-gradient-to-t from-black/60 to-transparent">
                <button onClick={() => fileRef.current?.click()} type="button"
                  className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-button bg-white/90 backdrop-blur text-xs font-medium active:scale-95 transition-transform">
                  <RefreshCw className="w-3.5 h-3.5" /> {t('hosting.photos.change_cover')}
                </button>
                <button onClick={() => { update('coverPhoto', null); setImgLoaded(false); }} type="button"
                  className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-button bg-white/90 backdrop-blur text-xs font-medium text-destructive active:scale-95 transition-transform">
                  <Trash2 className="w-3.5 h-3.5" /> {t('hosting.photos.remove_cover')}
                </button>
              </div>
            )}
          </>
        ) : (
          <button onClick={() => fileRef.current?.click()} type="button" disabled={uploading}
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground hover:bg-muted/30 transition-colors disabled:opacity-50">
            {uploading ? (
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <ImagePlus className="w-8 h-8 text-primary" />
              </div>
            )}
            <div className="text-center">
              <p className="text-sm font-medium">{uploading ? t('common.loading') : t('hosting.step_photos.upload')}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t('hosting.photos.aspect_ratio')}</p>
            </div>
          </button>
        )}
      </div>

      {uploadError && <p className="text-sm text-destructive text-center">{uploadError}</p>}

      {/* Upload options */}
      {!cover && !uploading && (
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => fileRef.current?.click()} type="button"
            className="flex items-center justify-center gap-2 h-12 rounded-button border border-border text-sm font-medium hover:bg-muted/50 active:scale-95 transition-all">
            <ImagePlus className="w-4 h-4 text-primary" /> {t('common.upload')}
          </button>
          <button onClick={() => cameraRef.current?.click()} type="button"
            className="flex items-center justify-center gap-2 h-12 rounded-button border border-border text-sm font-medium hover:bg-muted/50 active:scale-95 transition-all">
            <Camera className="w-4 h-4 text-primary" /> {t('circles.inmood_actions.camera')}
          </button>
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileSelect} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFileSelect} />

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
              onSelect={() => { setUploadError(''); setImgLoaded(false); update('coverPhoto', img); }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}