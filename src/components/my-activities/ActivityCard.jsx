import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, Share2, Eye, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLocalization } from '@/lib/i18n/useLocalization';

const statusConfig = {
  upcoming: { label: 'Upcoming', class: 'bg-info text-info-foreground' },
  live: { label: 'Live', class: 'bg-success text-success-foreground' },
  completed: { label: 'Completed', class: 'bg-foreground/70 text-background' },
  cancelled: { label: 'Cancelled', class: 'bg-destructive text-destructive-foreground' },
  pending: { label: 'Pending Approval', class: 'bg-warning text-warning-foreground' },
  invite_only: { label: 'Invite Only', class: 'bg-primary text-primary-foreground' },
};

export default function ActivityCard({ activity, tab }) {
  const { t } = useLocalization();
  const navigate = useNavigate();
  const { id, image, title, type, date, time, distance, status, host, spotsRemaining } = activity;
  const statusCfg = statusConfig[status] || statusConfig.upcoming;
  const detailLink = `/${type === 'experience' ? 'experience' : 'circle'}/${id}`;

  return (
    <div className="rounded-2xl overflow-hidden border border-border bg-card hover-lift">
      <div className="relative h-36">
        <img src={image} alt={title} className="w-full h-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <span className={`absolute top-2.5 start-2.5 text-[10px] font-semibold px-2 py-0.5 rounded-full ${type === 'experience' ? 'bg-primary text-primary-foreground' : 'bg-success text-success-foreground'}`}>
          {type === 'experience' ? 'Experience' : 'Circle'}
        </span>
        <span className={`absolute top-2.5 end-2.5 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${statusCfg.class}`}>
          {status === 'live' && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
          {statusCfg.label}
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-sm mb-2 line-clamp-1">{title}</h3>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {date}</span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {time}</span>
          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {distance}</span>
        </div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <Avatar className="w-6 h-6 flex-shrink-0">
              <AvatarImage src={host.avatar} alt={host.name} />
              <AvatarFallback className="text-[9px] bg-primary/10 text-primary">{host.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground truncate">{host.name}</span>
          </div>
          <span className="text-xs font-medium flex items-center gap-1 flex-shrink-0">
            <Users className="w-3 h-3 text-muted-foreground" /> {spotsRemaining} left
          </span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 gap-1.5 h-8" onClick={() => navigate(detailLink)}>
            <Eye className="w-3.5 h-3.5" /> {t('my_activities.view_details')}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Share2 className="w-4 h-4" />
          </Button>
          {tab === 'Saved' && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
          {tab === 'Upcoming' && (
            <Button variant="ghost" size="sm" className="h-8 text-destructive hover:text-destructive">
              {t('hosting.create.cancel')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}