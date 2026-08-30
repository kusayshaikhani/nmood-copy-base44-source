import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Sparkles, Crown } from 'lucide-react';
import { useExperiences } from '@/lib/discover-store';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { useOriginState } from '@/lib/safe-navigation';

export default function FollowUp({ experience }) {
  const { t } = useLocalization();
  const navigate = useNavigate();
  const originState = useOriginState();
  const { experiences } = useExperiences();
  const similar = experiences.filter(e => e.id !== experience.id && e.category === experience.category).slice(0, 4);

  return (
    <div className="space-y-4">
      <div className="text-center py-3">
        <div className="text-4xl mb-2">💌</div>
        <h2 className="font-semibold text-lg">{t('experience_day.thank_you')}</h2>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">{t('experience_day.hope_you_enjoyed')}</p>
      </div>

      {similar.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-accent" />{t('experiences.similar.title')}</h3>
          <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4">
            {similar.map(exp => (
              <button key={exp.id} onClick={() => navigate(`/experience/${exp.id}`)} type="button" className="flex-shrink-0 w-44 text-start">
                <img src={exp.image} alt={exp.title} className="w-full h-24 rounded-xl object-cover mb-1.5" loading="lazy" />
                <p className="text-xs font-semibold truncate">{exp.title}</p>
                <p className="text-[10px] text-muted-foreground">{exp.date} · {exp.time}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => navigate('/host/create', { state: originState() })}
        type="button"
        className="w-full flex items-center gap-3 p-4 rounded-2xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-default text-start"
      >
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Crown className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{t('experiences.detail.host_your_own')}</p>
          <p className="text-xs text-muted-foreground">{t('experience_day.host_cta')}</p>
        </div>
      </button>

      <button
        onClick={() => navigate('/pals')}
        type="button"
        className="w-full flex items-center gap-3 p-4 rounded-2xl border border-border bg-card hover:bg-muted/50 transition-default text-start"
      >
        <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
          <Heart className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{t('experiences.pals.title')}</p>
          <p className="text-xs text-muted-foreground">{t('experience_day.see_pals')}</p>
        </div>
      </button>
    </div>
  );
}