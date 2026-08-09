import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, MessageCircle, Users, Clock } from 'lucide-react';
import { openInMaps } from '@/lib/experience-day-engine';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function GettingReadyActions({ experience }) {
  const { t } = useLocalization();
  const navigate = useNavigate();
  const id = experience.id;

  const actions = [
    { icon: MapPin, label: 'Open Map', color: 'text-info', bg: 'bg-info/10', onClick: () => openInMaps(experience) },
    { icon: MessageCircle, label: 'Message Group', color: 'text-primary', bg: 'bg-primary/10', onClick: () => navigate(`/experience/${id}/chat`) },
    { icon: Users, label: 'Participants', color: 'text-accent-foreground', bg: 'bg-accent/20', onClick: () => navigate(`/experience/${id}`) },
  ];

  return (
    <div className="space-y-3">
      <div className="text-center py-2">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
          <Clock className="w-6 h-6 text-primary" />
        </div>
        <h2 className="font-semibold text-lg">{t('experiences.chat.getting_ready')}</h2>
        <p className="text-sm text-muted-foreground">{t('experience_day.starts_soon')}</p>
      </div>
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
    </div>
  );
}