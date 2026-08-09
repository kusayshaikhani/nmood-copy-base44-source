import React, { useRef, useState } from 'react';
import { Camera, ImagePlus, Upload, Sparkles, RefreshCw, Trash2, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { validateImageFile } from '@/lib/upload-security';
import { useLocalization } from '@/lib/i18n/useLocalization';

const suggestedCovers = [
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600',
  'https://images.unsplash.com/photo-1606914502047-4728c0cbd3cc?w=600',
  'https://images.unsplash.com/photo-1452587925148-ce54479dab4e?w=600',
  'https://images.unsplash.com/photo-1515464039244-8b30a80c5c5f?w=600',
  'https://images.unsplash.com/photo-1593810451137-5dc55705239d?w=600',
  'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600',
];

export default function StepPhotos({ data, update }) {
  const { t } = useLocalization();
  const fileRef = useRef(null);
  const cameraRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [localPreview, setLocalPreview] = useState(null);
  const [uploadError, setUploadError] = useState('');

  const cover = localPreview || data.coverPhoto;

  const handleFile = async (file) => {
    if (!file) return;
    const v = validateImageFile(file);
    if (!v.ok) { setUploadError(v.error); return; }
    setUploadError('');
    setUploading(true);
    setLocalPreview(URL.createObjectURL(file));
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      update('coverPhoto', file_url);
      setLocalPreview(null);
    } catch (e) {
      setUploadError("We couldn't upload your cover photo. Please try again.");
      setLocalPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const onFileSelect = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) handleFile(file);
  };

  const removeCover = () => {
    update('coverPhoto', null);
    setLocalPreview(null);
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
                <button onClick={() => fileRef.current?.click()} type="button"
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
          <button onClick={() => fileRef.current?.click()} type="button" disabled={uploading}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:bg-muted/30 transition-default disabled:opacity-50">
            {uploading ? <Loader2 className="w-10 h-10 animate-spin" /> : <ImagePlus className="w-10 h-10" />}
            <p className="text-xs">{uploading ? 'Uploading…' : 'Tap to upload a cover photo'}</p>
          </button>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center">{t('hosting.photos.aspect_ratio')}</p>

      {uploadError && (
        <p className="text-sm text-destructive text-center">{uploadError}</p>
      )}

      {!cover && !uploading && (
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => fileRef.current?.click()} type="button"
            className="flex items-center justify-center gap-2 h-12 rounded-xl border border-border text-sm font-medium hover:bg-muted/40 transition-default">
            <Upload className="w-4 h-4 text-primary" /> {t('common.upload')}
          </button>
          <button onClick={() => cameraRef.current?.click()} type="button"
            className="flex items-center justify-center gap-2 h-12 rounded-xl border border-border text-sm font-medium hover:bg-muted/40 transition-default">
            <Camera className="w-4 h-4 text-primary" /> {t('circles.inmood_actions.camera')}
          </button>
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileSelect} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFileSelect} />

      <div>
        <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-primary" /> {t('hosting.photos.suggested_covers')}
        </p>
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          {suggestedCovers.map((img) => (
            <button key={img} onClick={() => { setUploadError(''); update('coverPhoto', img); }} type="button"
              className={`w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-default ${data.coverPhoto === img ? 'border-primary ring-2 ring-primary/20' : 'border-border'}`}>
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}