import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MapPin, Users, MessageCircle, Mail, Eye, Star, Check } from 'lucide-react';
import PalCardMenu from './PalCardMenu';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function PalCard({ pal, onView, onInvite, onMessage, onRemove, isFavorite, onToggleFavorite, selectMode, isSelected, onToggleSelect }) {
  const { t } = useLocalization();
  const handleClick = selectMode ? () => onToggleSelect?.(pal.id) : undefined;

  return (
    <div
      onClick={handleClick}
      className={'p-4 rounded-2xl border bg-card transition-default ' + (selectMode ? 'cursor-pointer' : 'hover-lift') + ' ' + (isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-border')}
    >
      <div className="flex gap-3 mb-3">
        <div className="relative flex-shrink-0">
          <Avatar className="w-14 h-14">
            <AvatarImage src={pal.avatar} alt={pal.name} />
            <AvatarFallback className="bg-primary/10 text-primary">{(pal.name || 'U').charAt(0)}</AvatarFallback>
          </Avatar>
          {pal.showOnlineStatus && pal.online && (
            <span className="absolute bottom-0 end-0 w-3.5 h-3.5 rounded-full bg-success border-2 border-card" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <h3 className="font-semibold text-sm truncate">{pal.name}</h3>
                {isFavorite && !selectMode && <Star className="w-3 h-3 text-warning fill-current flex-shrink-0" />}
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {pal.city || t('connections.pal.default_city')}
              </p>
            </div>
            {selectMode ? (
              <div className={'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ' + (isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/30')}>
                {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
              </div>
            ) : (
              <div className="flex items-center gap-0.5 flex-shrink-0">
                <button onClick={() => onToggleFavorite?.(pal.id)} type="button" className="p-1.5 rounded-lg hover:bg-muted transition-default">
                  <Star className={'w-4 h-4 ' + (isFavorite ? 'text-warning fill-current' : 'text-muted-foreground')} />
                </button>
                <PalCardMenu palName={pal.name} onView={onView} onMessage={onMessage} onRemove={onRemove} />
              </div>
            )}
          </div>
        </div>
      </div>

      {pal.sharedInterests?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2.5">
          {pal.sharedInterests.map((i) => (
            <span key={i} className="text-[10px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">{i}</span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {t('connections.pal.mutual', { count: pal.mutualExperiences })}</span>
        {pal.lastExperienceTogether && <span className="truncate">{t('connections.pal.last_experience', { name: pal.lastExperienceTogether })}</span>}
      </div>

      {!selectMode && (
        <div className="flex gap-1.5">
          <Button size="sm" className="flex-1 h-8 text-xs gap-1.5" onClick={onMessage}>
            <MessageCircle className="w-3 h-3" /> {t('connections.pal.message')}
          </Button>
          <Button variant="outline" size="sm" className="flex-1 h-8 text-xs gap-1.5" onClick={onInvite}>
            <Mail className="w-3 h-3" /> {t('connections.pal.invite')}
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onView}>
            <Eye className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}