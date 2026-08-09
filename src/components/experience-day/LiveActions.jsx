import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, MessageCircle, Flag, Radio, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function LiveActions({ experience, arrived, onArrive }) {
  const { t } = useLocalization();
  const navigate = useNavigate();
  const id = experience.id;

  const handleSharePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const key = `inmood_moments_${id}`;
      const moments = JSON.parse(localStorage.getItem(key) || '[]');
      localStorage.setItem(key, JSON.stringify([...moments, file_url]));
    } catch {}
  };

  const actions = [
    { icon: Camera, label: 'Share Photo', color: 'text-primary', bg: 'bg-primary/10', onClick: () => document.getElementById('live-photo-upload')?.click() },
    { icon: MessageCircle, label: 'Message Group', color: 'text-info', bg: 'bg-info/10', onClick: () => navigate(`/experience/${id}/chat`) },
    { icon: Flag, label: 'Report Issue', color: 'text-destructive', bg: 'bg-destructive/10', onClick: () => navigate(`/experience/${id}`) },
  ];

  return (
    <div className="space-y-3">
      <div className="text-center py-2">
        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-2">
          <Radio className="w-6 h-6 text-red-500 animate-pulse" />
        </div>
        <h2 className="font-semibold text-lg">{t('experiences.day.happening_now')}</h2>
        <p className="text-sm text-muted-foreground">{t('experience_day.live_enjoy')}</p>
      </div>

      {arrived ? (
        <div className="flex items-center justify-center gap-2 py-2 text-success">
          <CheckCircle className="w-5 h-5" />
          <span className="text-sm font-medium">{t('experience_day.checked_in')}</span>
        </div>
      ) : (
        <button onClick={onArrive} type="button" className="w-full py-3 rounded-2xl bg-card border border-border hover:bg-muted text-sm font-semibold transition-default">
          {t('experience_day.im_here')}
        </button>
      )}

      <div className="grid grid-cols-3 gap-3">
        {actions.map(({ icon: Icon, label, color, bg, onClick }) => (
          <button key={label} onClick={onClick} type="button" className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-border bg-card hover-lift">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <span className="text-xs font-medium text-center">{label}</span>
          </button>
        ))}
      </div>
      <input id="live-photo-upload" type="file" accept="image/*" className="hidden" onChange={handleSharePhoto} />
    </div>
  );
}