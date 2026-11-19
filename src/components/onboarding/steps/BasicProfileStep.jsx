import { withTimeout } from '@/lib/bounded-operation';
import NativePhotoInput from '@/components/media/NativePhotoInput';
import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, Image as ImageIcon, X, Loader2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import OnboardingGenderField from './OnboardingGenderField';
import BottomSheet from '@/components/shared/BottomSheet';
import { base44 } from '@/api/base44Client';
import { uploadProfilePhoto } from '@/api/supabaseClient';
import { useSupabase } from '@/config/supabase-config';
import { validateImageFile } from '@/lib/upload-security';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { captureProfilePhoto } from '@/lib/profile-photo-camera';

// A member-supplied display name and profile photo are required. Existing names
// from signup or an OAuth provider remain editable; Nmood never fabricates one.
// Dating preferences are required so the first Home deck is relevant.
export default function BasicProfileStep({ data, update, onNext, onNavigationBlockedChange }) {
  const { t } = useLocalization();
  const [showPhotoSheet, setShowPhotoSheet] = useState(false);
  const [uploading, setUploading] = useState(false);
  useEffect(()=>{onNavigationBlockedChange?.(uploading);},[uploading,onNavigationBlockedChange]);
  const [uploadError, setUploadError] = useState('');
  const active=useRef(true);
  useEffect(()=>{active.current=true;return()=>{active.current=false;};},[]);
  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const uploadSelectedPhoto = async (file) => {
    if (!file || !active.current) return;
    const v = validateImageFile(file);
    if (!v.ok) { setUploadError(v.error); return; }
    setShowPhotoSheet(false);
    setUploading(true);
    setUploadError('');
    try {
      const photoUrl = useSupabase
        ? await withTimeout(()=>uploadProfilePhoto(file))
        : (await base44.integrations.Core.UploadFile({ file })).file_url;
      if(active.current)update({ photo_url: photoUrl });
    } catch {
      // An upload failure must never look like the picker ignored the member.
      if(active.current)setUploadError('We could not upload that photo. Please try again.');
    } finally {
      if(active.current)setUploading(false);
    }
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    await uploadSelectedPhoto(file);
  };

  const handleTakePhoto = async () => {
    setShowPhotoSheet(false);
    try {
      const result = await captureProfilePhoto();
      if (result?.fallback) {
        cameraInputRef.current?.click();
        return;
      }
      await uploadSelectedPhoto(result);
    } catch {
      if(active.current)setUploadError('We could not open the camera. Please try again.');
    }
  };

  const handleNext = () => {
    if (uploading) return;
    if (!data.display_name?.trim()) {
      setUploadError('Enter the name you want people to see to continue.');
      return;
    }
    if (!data.photo_url) {
      setUploadError('Add at least one profile photo to continue.');
      return;
    }
    onNext();
  };

  return (
    <div>
      <div className="mb-6 space-y-2">
        <Label htmlFor="onboarding-display-name">{t('onboarding.field.display_name')}</Label>
        <Input id="onboarding-display-name" value={data.display_name || ''}
          onChange={(event) => { update({ display_name: event.target.value }); setUploadError(''); }}
          maxLength={80} autoComplete="name" placeholder={t('onboarding.placeholder.display_name')} required />
        {!data.display_name?.trim() && <p className="text-xs text-muted-foreground">Add your name to complete your profile. Nmood will never invent one for you.</p>}
      </div>
      {/* Large required profile photo */}
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
        {uploadError && <p className="mt-2 text-center text-xs text-destructive">{uploadError}</p>}
      </div>

      <BottomSheet open={showPhotoSheet} onOpenChange={setShowPhotoSheet} title={t('onboarding.photo.sheet_title')}>
        <div className="space-y-1 pb-2">
          <button onClick={handleTakePhoto} className="flex items-center gap-3 w-full p-3.5 rounded-2xl hover:bg-muted transition-default" type="button">
            <Camera className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium">{t('onboarding.photo.take')}</span>
          </button>
          <button onClick={() => galleryInputRef.current?.click()} className="flex items-center gap-3 w-full p-3.5 rounded-2xl hover:bg-muted transition-default" type="button">
            <ImageIcon className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium">{t('onboarding.photo.gallery')}</span>
          </button>
        </div>
      </BottomSheet>

      <NativePhotoInput ref={cameraInputRef} type="file" accept="image/*" capture="user" className="hidden" onChange={handleFileSelect} />
      <NativePhotoInput ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />

      {/* Optional details — never block entering the app */}
      <div className="space-y-4">
        <OnboardingGenderField value={data.gender} update={update} />
        <div className="space-y-2">
          <label className="text-sm font-medium">I’m here for</label>
          <div className="grid grid-cols-3 gap-3">
            {[['male','Men'],['female','Women'],['community_only','Community']].map(([value,label]) => <button key={value} type="button" aria-pressed={data.dating_looking_for_gender === value} onClick={() => update({ dating_looking_for_gender: value })} className={`min-h-12 rounded-xl border px-3 text-sm font-semibold ${data.dating_looking_for_gender === value ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-card'}`}>{label}</button>)}
          </div>
          <p className="text-xs text-muted-foreground">This is shown on your profile and can be used in People filters. You can change it later in profile settings.</p>
        </div>


        <div>
          <Label htmlFor="bio">Hint about me</Label>
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

      <div className="sticky bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-20 mt-7 bg-background/95 py-2 backdrop-blur">
      <Button className="w-full h-12 shadow-elevated" onClick={handleNext}>
        {t('common.continue')}
      </Button>
      </div>
    </div>
  );
}
