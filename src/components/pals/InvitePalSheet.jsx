import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, Plus, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BottomSheet from '@/components/shared/BottomSheet';
import { useExperiences } from '@/lib/discover-store';
import { useMergedCircles } from '@/lib/circle-store';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function InvitePalSheet({ pals, open, onOpenChange }) {
  const { t } = useLocalization();
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();
  const palList = pals || [];
  const { experiences } = useExperiences();
  const mergedCircles = useMergedCircles();
  const title = palList.length > 1 ? t('connections.invite.title_multi', { count: palList.length }) : t('connections.invite.title_single', { name: palList[0]?.name || '' });

  const handleInvite = () => {
    setSent(true);
    setTimeout(() => { setSent(false); onOpenChange(false); }, 1500);
  };

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title={title} description={t('connections.invite.description')}>
      <div className="space-y-4 pb-2">
        {sent ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-success mx-auto mb-2" />
            <p className="text-sm font-medium text-success">{palList.length > 1 ? t('connections.invite.sent_plural') : t('connections.invite.sent')}</p>
          </div>
        ) : (
          <>
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">{t('connections.invite.experiences')}</p>
              <div className="space-y-2">
                {experiences.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">{t('discovery.empty.no_experiences.desc') || 'No experiences available yet.'}</p>
                ) : experiences.slice(0, 4).map(exp => (
                  <button key={exp.id} onClick={handleInvite} type="button" className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-border hover:bg-muted/50 transition-default text-start">
                    <img src={exp.image} alt={exp.title} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" loading="lazy" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{exp.title}</p>
                      <p className="text-xs text-muted-foreground">{exp.date} · {exp.time}</p>
                    </div>
                    <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">{t('connections.invite.circles')}</p>
              <div className="space-y-2">
                {mergedCircles.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">{t('pals.no_circles_available')}</p>
                ) : mergedCircles.slice(0, 3).map(circle => (
                  <button key={circle.id} onClick={handleInvite} type="button" className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-border hover:bg-muted/50 transition-default text-start">
                    <img src={circle.cover_photo} alt={circle.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" loading="lazy" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{circle.name}</p>
                      <p className="text-xs text-muted-foreground">{t('connections.invite.members', { count: circle.member_count || 0 })}</p>
                    </div>
                    <Users className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            <Button variant="outline" className="w-full gap-2" onClick={() => { onOpenChange(false); navigate('/host/create'); }}>
              <Plus className="w-4 h-4" /> {t('connections.invite.create_new')}
            </Button>
          </>
        )}
      </div>
    </BottomSheet>
  );
}