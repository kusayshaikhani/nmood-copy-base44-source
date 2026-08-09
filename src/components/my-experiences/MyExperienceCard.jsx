import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, Share2, X, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocalization } from '@/lib/i18n/useLocalization';

const statusConfig = {
  confirmed: { label: 'Confirmed', className: 'bg-success/10 text-success' },
  pending: { label: 'Pending', className: 'bg-warning/10 text-warning' },
  host: { label: 'Hosting', className: 'bg-primary/10 text-primary' },
  saved: { label: 'Saved', className: 'bg-info/10 text-info' },
  attended: { label: 'Attended', className: 'bg-muted text-muted-foreground' },
};

export default function MyExperienceCard({ experience, onCancel, onShare, onInvite }) {
  const { t } = useLocalization();
  const { id, image, title, date, time, venue, status, isPast } = experience;
  const config = statusConfig[status] || statusConfig.confirmed;
  const canCancel = status === 'confirmed' || status === 'pending';

  return (
    <div className="flex gap-3 p-3 rounded-2xl border border-border bg-card">
      <Link to={`/experience/${id}`} className="flex-shrink-0">
        <img src={image} alt={title} className="w-20 h-20 rounded-xl object-cover" />
      </Link>
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-1">
          <Link to={`/experience/${id}`} className="text-sm font-semibold truncate hover:text-primary transition-default">
            {title}
          </Link>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${config.className}`}>
            {config.label}
          </span>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground mb-auto">
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {date}</span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {time}</span>
          <span className="flex items-center gap-1 truncate"><MapPin className="w-3 h-3" /> {venue?.name}</span>
        </div>
        <div className="flex gap-2 mt-2">
          {canCancel && (
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1 px-2" onClick={() => onCancel(experience)}>
              <X className="w-3 h-3" /> {t('hosting.create.cancel')}
            </Button>
          )}
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 px-2" onClick={() => onShare(experience)}>
            <Share2 className="w-3 h-3" /> {t('hosting.success.share')}
          </Button>
          {onInvite && (
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 px-2" onClick={() => onInvite(experience)}>
              <UserPlus className="w-3 h-3" /> {t('experiences.chat.invite')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}