import React from 'react';
import { MapPin, Calendar, Clock, Wallet, Flag, LogOut, Crown } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import BottomSheet from '@/components/shared/BottomSheet';
import { Button } from '@/components/ui/button';
import { getBudgetDetailLabel } from '@/lib/budget-utils';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function ChatInfoSheet({ open, onOpenChange, experience, participants, onLeave, onReport }) {
  const { t } = useLocalization();
  if (!experience) return null;
  const budgetLabel = getBudgetDetailLabel(experience);
  const details = [
    { icon: Calendar, label: 'Date', value: experience.date },
    { icon: Clock, label: 'Time', value: experience.time },
    { icon: MapPin, label: 'Location', value: experience.venue?.name },
    { icon: Wallet, label: 'Budget', value: budgetLabel },
  ];

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title={t('experiences.chat.info')} description={experience.title}>
      <div className="space-y-5 pb-2">
        <div className="space-y-2.5">
          {details.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-2.5 text-sm">
              <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground">{label}</span>
              <span className="font-medium ml-auto">{value}</span>
            </div>
          ))}
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-2">Participants ({participants.length})</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto no-scrollbar">
            {participants.map((p, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={p.avatar} alt={p.name} />
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">{p.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{p.name}</span>
                {p.isOrganizer && (
                  <span className="flex items-center gap-1 text-xs text-primary font-medium">
                    <Crown className="w-3 h-3" /> {t('experiences.host.organizer')}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {experience.about?.what && (
          <div>
            <h3 className="text-sm font-semibold mb-1.5">{t('community.detail.tab_rules')}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{experience.about.what}</p>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1 gap-2" onClick={onReport}>
            <Flag className="w-4 h-4" /> {t('circles.actionbar.report')}
          </Button>
          <Button variant="destructive" className="flex-1 gap-2" onClick={onLeave}>
            <LogOut className="w-4 h-4" /> {t('experiences.leave.leave')}
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}