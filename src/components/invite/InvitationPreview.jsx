import React from 'react';
import { Calendar, Clock, MapPin, Wallet, MessageCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function InvitationPreview({ experience, selectedPals, message }) {
  const { t } = useLocalization();
  const items = [
    { icon: Calendar, label: experience?.date },
    { icon: Clock, label: experience?.time },
    { icon: MapPin, label: experience?.venue?.name },
    { icon: Wallet, label: experience?.budget || '—' },
  ];

  return (
    <div className="space-y-3">
      <div className="rounded-2xl overflow-hidden border border-border">
        <img src={experience?.image} alt={experience?.title} className="w-full h-32 object-cover" loading="lazy" />
        <div className="p-3 bg-card">
          <p className="font-semibold text-sm">{experience?.title}</p>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {items.map(({ icon: Icon, label }, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Icon className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-3">
        <p className="text-xs font-semibold text-muted-foreground mb-2">{t('connections.invite_exp.inviting', { count: selectedPals.length })}</p>
        <div className="flex flex-wrap gap-2">
          {selectedPals.map(pal => (
            <div key={pal.id} className="flex items-center gap-1.5">
              <Avatar className="w-6 h-6">
                <AvatarImage src={pal.avatar} alt={pal.name} />
                <AvatarFallback className="bg-primary/10 text-primary text-[10px]">{pal.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="text-xs font-medium">{pal.name.split(' ')[0]}</span>
            </div>
          ))}
        </div>
      </div>

      {message && message.trim() && (
        <div className="rounded-2xl border border-border bg-card p-3">
          <p className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
            <MessageCircle className="w-3 h-3" /> {t('connections.invite_exp.personal_message')}
          </p>
          <p className="text-sm italic text-foreground/80">“{message}”</p>
        </div>
      )}
    </div>
  );
}