import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
 * UI-021 — Circle Step 1: Identity (cover + logo upload).
 * Large 16:9 cover, circular logo, camera/gallery/replace, fade-in on load.
 */
export default function CircleStepIdentity({ data, update }) {
  const { t } = useLocalization();
  const coverRef = useRef(null);
  const coverCameraRef = useRef(null);
  const logoRef = useRef(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [coverLoaded, setCoverLoaded] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [coverError, setCoverError] = useState('');
  const [logoError, setLogoError] = useState('');

  const handleCover = async (file) => {
    if (!file) return;
    const v = validateImageFile(file);
    if (!v.ok) { setCoverError(v.error); return; }
    setCoverError('');
    setUploadingCover(true);
    setCoverLoaded(false);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      update('coverPhoto', file_url);
    } catch {
      setCoverError(t('create.circle.upload_error'));
    } finally {
      setUploadingCover(false);
    }
  };

  const handleLogo = async (file) => {
    if (!file) return;
    const v = validateImageFile(file);
    if (!v.ok) { setLogoError(v.error); return; }
    setLogoError('');
    setUploadingLogo(true);
    setLogoLoaded(false);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      update('logoPhoto', file_url);
    } catch {
      setLogoError(t('create.circle.upload_error'));
    } finally {
      setUploadingLogo(false);
    }
  };

  const onCoverSelect = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) handleCover(file);
  };

  const onLogoSelect = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) handleLogo(file);
  };

  const cover = data.coverPhoto;
  const logo = data.logoPhoto;

  return (
    <div className="space-y-6">
      <div className="text-center mb-2">
        <h2 className="text-2xl font-bold">{t('create.circle.identity_title')}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t('create.circle.identity_subtitle')}</p>
      </div>

      {/* Cover upload */}
      <div>
        <p className="text-sm font-medium mb-2.5">{t('create.circle.cover_label')}</p>
        <div className="relative aspect-video rounded-card overflow-hidden border-2 border-dashed border-border/60 shadow-card">
          <AnimatePresence mode="wait">
            {cover ? (
              <motion.div
                key={cover}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full h-full"
              >
                <img
                  src={cover}
                  alt=""
                  onLoad={() => setCoverLoaded(true)}
                  className={`w-full h-full object-cover transition-opacity duration-500 ${coverLoaded ? 'opacity-100' : 'opacity-0'}`}
                />
                {!coverLoaded && !uploadingCover && <div className="absolute inset-0 shimmer" />}
                {uploadingCover && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                )}
                {!uploadingCover && (
                  <div className="absolute bottom-0 start-0 end-0 flex gap-2 p-3 bg-gradient-to-t from-black/60 to-transparent">
                    <button onClick={() => coverRef.current?.click()} type="button"
                      className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-button bg-white/90 backdrop-blur text-xs font-medium active:scale-95 transition-transform">
                      <RefreshCw className="w-3.5 h-3.5" /> {t('hosting.photos.change_cover')}
                    </button>
                    <button onClick={() => { update('coverPhoto', null); setCoverLoaded(false); }} type="button"
                      className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-button bg-white/90 backdrop-blur text-xs font-medium text-destructive active:scale-95 transition-transform">
                      <Trash2 className="w-3.5 h-3.5" /> {t('hosting.photos.remove_cover')}
                    </button>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.button
                key="empty"
                onClick={() => coverRef.current?.click()}
                type="button"
                disabled={uploadingCover}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground hover:bg-muted/30 transition-colors disabled:opacity-50"
              >
                {uploadingCover ? (
                  <Loader2 className="w-12 h-12 animate-spin text-primary" />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <ImagePlus className="w-8 h-8 text-primary" />
                  </div>
                )}
                <div className="text-center">
                  <p className="text-sm font-medium">{uploadingCover ? t('common.loading') : t('create.circle.upload_cover')}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t('hosting.photos.aspect_ratio')}</p>
                </div>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
        {coverError && <p className="text-sm text-destructive text-center mt-1.5">{coverError}</p>}
      </div>

      {/* Logo upload */}
      <div>
        <p className="text-sm font-medium mb-2.5">{t('create.circle.logo_label')}</p>
        <div className="flex items-center gap-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-dashed border-border/60 shadow-card flex-shrink-0"
          >
            <AnimatePresence mode="wait">
              {logo ? (
                <motion.div
                  key={logo}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full h-full"
                >
                  <img
                    src={logo}
                    alt=""
                    onLoad={() => setLogoLoaded(true)}
                    className={`w-full h-full object-cover transition-opacity duration-500 ${logoLoaded ? 'opacity-100' : 'opacity-0'}`}
                  />
                  {!logoLoaded && <div className="absolute inset-0 shimmer" />}
                </motion.div>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted/40">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <ImagePlus className="w-5 h-5 text-primary" />
                  </div>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
          <div className="flex-1 space-y-2">
            <button
              onClick={() => logoRef.current?.click()}
              type="button"
              disabled={uploadingLogo}
              className="flex items-center justify-center gap-2 h-11 w-full rounded-button border border-border text-sm font-medium hover:bg-muted/50 active:scale-95 transition-all disabled:opacity-50"
            >
              {uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4 text-primary" />}
              {logo ? t('hosting.photos.change_cover') : t('create.circle.upload_logo')}
            </button>
            {logo && (
              <button
                onClick={() => { update('logoPhoto', null); setLogoLoaded(false); }}
                type="button"
                className="flex items-center justify-center gap-2 h-11 w-full rounded-button border border-destructive/30 text-sm font-medium text-destructive hover:bg-destructive/5 active:scale-95 transition-all"
              >
                <Trash2 className="w-4 h-4" /> {t('hosting.photos.remove_cover')}
              </button>
            )}
          </div>
        </div>
        {logoError && <p className="text-sm text-destructive mt-1.5">{logoError}</p>}
      </div>

      <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={onCoverSelect} />
      <input ref={coverCameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onCoverSelect} />
      <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={onLogoSelect} />

      {/* Suggested covers */}
      <div>
        <p className="text-sm font-medium mb-3 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-primary" /> {t('hosting.photos.suggested_covers')}
        </p>
        <div className="flex gap-3 overflow-x-auto no-scrollbar overscroll-x-contain snap-x snap-mandatory pb-2">
          {suggestedCovers.map((img) => (
            <SuggestedCoverThumb
              key={img}
              src={img}
              selected={data.coverPhoto === img}
              onSelect={() => { setCoverError(''); setCoverLoaded(false); update('coverPhoto', img); }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}