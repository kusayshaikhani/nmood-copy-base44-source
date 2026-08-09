import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Info, Users, Clock } from 'lucide-react';
import { getCountdown } from '@/lib/discover-engine';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function ExperienceChatHeader({ experience, participantCount, onInfo }) {
  const { t } = useLocalization();
  const navigate = useNavigate();
  const countdown = getCountdown(experience);

  return (
    <div className="border-b border-border bg-card flex-shrink-0">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button onClick={() => navigate(`/experience/${experience.id}`)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted flex-shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-sm truncate">{experience.title}</h2>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{participantCount}</span>
            {countdown && <span className="flex items-center gap-1 text-primary font-medium"><Clock className="w-3 h-3" />{countdown}</span>}
          </div>
        </div>
        <button onClick={() => navigate(`/experience/${experience.id}`)} className="text-xs text-primary font-medium px-2.5 py-1.5 rounded-lg hover:bg-primary/5 flex-shrink-0">
          {t('hosting.success.view')}
        </button>
        <button onClick={onInfo} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted flex-shrink-0">
          <Info className="w-4 h-4" />
        </button>
      </div>
      <div className="relative h-14">
        <img src={experience.image} alt={experience.title} className="w-full h-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
      </div>
    </div>
  );
}