import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Camera, Image as ImageIcon, X, Loader2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import BottomSheet from '@/components/shared/BottomSheet';
import { base44 } from '@/api/base44Client';
import { genderOptions } from '@/lib/onboarding-data';
import { validateImageFile } from '@/lib/upload-security';
import { useLocalization } from '@/lib/i18n/useLocalization';

// Profile photo + optional details. Name and DOB are NOT collected here —
// they are set at signup (email form) or derived from the OAuth provider.
// Photo and gender are optional and never block entering the app.
export default function BasicProfileStep({ data, update, onNext }) {
  const { t } = useLocalization();
  const [showPhotoSheet, setShowPhotoSheet] = useState(false);
  const [uploading, setUploading] = useState(false);
  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const v = validateImageFile(file);
    if (!v.ok) { e.target.value = ''; return; }
    setShowPhotoSheet(false);
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      update({ photo_url: file_url });
    } catch {
      // best-effort — photo is optional
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  // No blocking validation — photo and gender are optional.
  const handleNext = () => onNext();

  return (
    <div>
      {/* Large profile photo (optional) */}
      <div className="flex flex-col items-center mb-7">
        <motion.button
          onClick={() => setShowPhotoSheet(true)}
          className="relative group"
          type="button"
          whileTap={{ scale: 0.97 }}
          aria-label={data.photo_url ? t('onboarding.photo.change') : t('onboarding.photo.add')}
        >
          <Avatar className="w-28 h-28 border-4 border-card shadow-elevated">
            {data.photo_url ? <AvatarImage src={data.photo_url} alt={t('onboarding.photo.sheet_title')} /> : null}
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20">
              {uploading ? <Loader2 className="w-8 h-8 animate-spin text-primary" /> : <User className="w-9 h-9 text-muted-foreground" />}
            </AvatarFallback>
          </Avatar>
          {!uploading && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="absolute bottom-0 end-0 w-9 h-9 rounded-full bg-nmood-gradient flex items-center justify-center border-4 border-background shadow-lg"
            >
              <Camera className="w-4 h-4 text-white" />
            </motion.div>
          )}
        </motion.button>
        <button
          onClick={() => setShowPhotoSheet(true)}
          className="text-sm text-primary font-semibold mt-3 hover:underline"
          type="button"
        >
          {data.photo_url ? t('onboarding.photo.change') : t('onboarding.photo.add')}
        </button>
        {data.photo_url && (
          <button
            onClick={() => update({ photo_url: null })}
            className="text-xs text-muted-foreground hover:text-destructive mt-1 flex items-center gap-1"
            type="button"
          >
            <X className="w-3 h-3" />{t('onboarding.photo.remove')}
          </button>
        )}
      </div>

      <BottomSheet open={showPhotoSheet} onOpenChange={setShowPhotoSheet} title={t('onboarding.photo.sheet_title')}>
        <div className="space-y-1 pb-2">
          <button onClick={() => cameraInputRef.current?.click()} className="flex items-center gap-3 w-full p-3.5 rounded-2xl hover:bg-muted transition-default" type="button">
            <Camera className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium">{t('onboarding.photo.take')}</span>
          </button>
          <button onClick={() => galleryInputRef.current?.click()} className="flex items-center gap-3 w-full p-3.5 rounded-2xl hover:bg-muted transition-default" type="button">
            <ImageIcon className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium">{t('onboarding.photo.gallery')}</span>
          </button>
        </div>
      </BottomSheet>

      <input ref={cameraInputRef} type="file" accept="image/*" capture="user" className="hidden" onChange={handleFileSelect} />
      <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />

      {/* Optional details — never block entering the app */}
      <div className="space-y-4">
        <div>
          <Select value={data.gender || ''} onValueChange={(v) => update({ gender: v })}>
            <SelectTrigger className="h-12 rounded-input">
              <SelectValue placeholder={t('onboarding.placeholder.select_gender')} />
            </SelectTrigger>
            <SelectContent>
              {genderOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{t('onboarding.gender.' + opt.value)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Textarea
            id="bio"
            value={data.bio || ''}
            onChange={(e) => update({ bio: e.target.value })}
            placeholder={t('onboarding.placeholder.bio')}
            rows={3}
            maxLength={200}
            className="rounded-input"
          />
          <p className="text-xs text-muted-foreground text-end mt-1">{(data.bio || '').length}/200</p>
        </div>
      </div>

      <Button className="w-full h-12 mt-7 shadow-elevated" onClick={handleNext}>
        {t('common.continue')}
      </Button>
    </div>
  );
}