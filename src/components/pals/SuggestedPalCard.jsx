import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Globe, Sparkles } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function SuggestedPalCard({ pal }) {
  const { t } = useLocalization();
  const { name, age, avatar, languages, sharedInterests, reason } = pal;

  return (
    <div className="flex-shrink-0 w-64 p-4 rounded-2xl border border-border bg-card hover-lift">
      <div className="flex flex-col items-center text-center mb-3">
        <Avatar className="w-16 h-16 mb-2 border-2 border-card shadow-sm">
          <AvatarImage src={avatar} alt={name} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">{name.charAt(0)}</AvatarFallback>
        </Avatar>
        <h3 className="font-semibold text-sm">{name}</h3>
        <p className="text-xs text-muted-foreground">{t('connections.suggested.years_old', { age })}</p>
      </div>

      {languages?.length > 0 && (
        <div className="flex items-center justify-center gap-1 mb-2 text-xs text-muted-foreground">
          <Globe className="w-3 h-3" />
          <span className="truncate">{languages.join(', ')}</span>
        </div>
      )}

      {sharedInterests?.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1 mb-2">
          {sharedInterests.map((interest) => (
            <span key={interest} className="text-[10px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {interest}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-center gap-1 mb-3 text-[11px] text-muted-foreground">
        <Sparkles className="w-3 h-3 text-accent" />
        <span className="text-center leading-tight">{reason}</span>
      </div>

      <Button size="sm" className="w-full h-9">{t('connections.suggested.send_request')}</Button>
    </div>
  );
}