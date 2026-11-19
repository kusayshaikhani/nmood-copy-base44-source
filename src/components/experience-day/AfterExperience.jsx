import NativePhotoInput from '@/components/media/NativePhotoInput';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Camera, UserPlus, Crown } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { submitExperienceReview } from '@/api/supabaseClient';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { toast } from '@/components/ui/use-toast';

export default function AfterExperience({ experience }) {
  const { t } = useLocalization();
  const navigate = useNavigate();
  const [rated, setRated] = useState(false);
  const [ratedHost, setRatedHost] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const id = experience.id;

  const handleRate = async () => {
    try {
      await submitExperienceReview(id, 5, 'Great experience!');
      setRated(true);
    } catch (error) {
      toast(error?.message || 'Your review could not be saved. Please try again.');
    }
  };

  const handleUploadPhotos = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const key = `inmood_moments_${id}`;
      const moments = JSON.parse(localStorage.getItem(key) || '[]');
      localStorage.setItem(key, JSON.stringify([...moments, file_url]));
      setUploaded(true);
    } catch {}
  };

  const actions = [
    { icon: Star, label: 'Rate Experience', desc: 'Share your feedback', done: rated, onClick: handleRate, color: 'text-warning', bg: 'bg-warning/10' },
    { icon: Crown, label: 'Rate Organizer', desc: 'How was the host?', done: ratedHost, onClick: () => setRatedHost(true), color: 'text-primary', bg: 'bg-primary/10' },
    { icon: Camera, label: 'Upload Photos', desc: 'Share your moments', done: uploaded, onClick: () => document.getElementById('after-photo-upload')?.click(), color: 'text-info', bg: 'bg-info/10' },
    { icon: UserPlus, label: 'Become Pals', desc: 'Stay connected', done: false, onClick: () => navigate(`/experience/${id}`), color: 'text-success', bg: 'bg-success/10' },
  ];

  return (
    <div className="space-y-3">
      <div className="text-center py-2">
        <div className="text-4xl mb-2">🎉</div>
        <h2 className="font-semibold text-lg">{t('experiences.chat.thanks')}</h2>
        <p className="text-sm text-muted-foreground">{t('experience_day.how_was_it')}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {actions.map(({ icon: Icon, label, desc, done, onClick, color, bg }) => (
          <button key={label} onClick={onClick} type="button" disabled={done} className="flex flex-col items-start gap-2 p-4 rounded-2xl border border-border bg-card hover-lift text-start disabled:opacity-60">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <p className="text-sm font-semibold">{done ? '✓ Done' : label}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
          </button>
        ))}
      </div>
      <NativePhotoInput id="after-photo-upload" type="file" accept="image/*" className="hidden" onChange={handleUploadPhotos} />
    </div>
  );
}
