import React, { useState } from 'react';
import { Clock, MapPin, Calendar as CalendarIcon, MoreHorizontal, MessageCircle, Map, Share2, Bell, LogOut, UserPlus, Bookmark } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDateLabel, statusColors } from '@/lib/calendar-data';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function CalendarActivityCard({ activity, onClick }) {
  const { t } = useLocalization();
  const [showActions, setShowActions] = useState(false);
  const [saved, setSaved] = useState(() => {
    const s = JSON.parse(localStorage.getItem('inmood_saved') || '[]');
    return s.includes(activity.id);
  });
  const cfg = statusColors[activity.status] || statusColors.joined;

  const handleAction = (e, fn) => {
    e.stopPropagation();
    setShowActions(false);
    fn?.();
  };

  const toggleSave = (e) => {
    e.stopPropagation();
    const s = JSON.parse(localStorage.getItem('inmood_saved') || '[]');
    const next = s.includes(activity.id) ? s.filter((x) => x !== activity.id) : [...s, activity.id];
    localStorage.setItem('inmood_saved', JSON.stringify(next));
    setSaved(!saved);
  };

  const isHosting = activity.status === 'hosting';
  const isJoined = activity.status === 'joined' || activity.status === 'circle' || activity.status === 'community';

  return (
    <Card
      className="overflow-hidden cursor-pointer hover:shadow-md transition-default"
      onClick={() => onClick && onClick(activity)}
    >
      <div className="flex gap-3 p-3">
        <div className="relative flex-shrink-0">
          <img
            src={activity.coverImage}
            alt=""
            className="w-16 h-16 rounded-xl object-cover"
            loading="lazy"
          />
          <div className={`absolute -start-1 top-1/2 -translate-y-1/2 w-1 h-12 rounded-full ${cfg.dot}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className={'text-xs px-2 py-0.5 rounded-full font-medium ' + cfg.badge}>
              {cfg.label}
            </span>
            {activity.community && (
              <span className="text-[10px] text-info font-medium truncate">{activity.community}</span>
            )}
            {activity.circle && (
              <span className="text-[10px] text-accent-foreground font-medium truncate">{activity.circle}</span>
            )}
          </div>
          <h3 className="font-semibold text-sm truncate mb-1.5">{activity.title}</h3>
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <CalendarIcon className="w-3 h-3 flex-shrink-0" />
              {formatDateLabel(activity.date)}
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Clock className="w-3 h-3 flex-shrink-0" />
              {activity.time} · {activity.duration}
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{activity.location}</span>
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setShowActions(!showActions); }}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted/50 transition-default flex-shrink-0"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      <div className="px-3 pb-2 flex items-center gap-2">
        <Avatar className="w-5 h-5">
          {activity.hostAvatar && <AvatarImage src={activity.hostAvatar} alt={activity.host} />}
          <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
            {activity.host.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <span className="text-xs text-muted-foreground">{activity.host}</span>
        {activity.palsAttending?.length > 0 && (
          <span className="text-xs text-primary font-medium ml-auto">
            {activity.palsAttending.length} pal{activity.palsAttending.length > 1 ? 's' : ''} attending
          </span>
        )}
      </div>

      {showActions && (
        <div className="px-3 pb-3 pt-1 flex flex-wrap gap-1.5 border-t border-border/50">
          {isHosting ? null : isJoined ? (
            <ActionBtn icon={LogOut} label={t('experiences.leave.leave')} onClick={(e) => handleAction(e)} />
          ) : activity.status === 'pending' ? (
            <ActionBtn icon={UserPlus} label={t('hosting.request.accept')} onClick={(e) => handleAction(e)} />
          ) : (
            <ActionBtn icon={UserPlus} label={t('community.card.join')} onClick={(e) => handleAction(e)} />
          )}
          <ActionBtn icon={Share2} label={t('hosting.success.invite')} onClick={(e) => handleAction(e)} />
          <ActionBtn icon={MessageCircle} label={t('community.detail.tab_chat')} onClick={(e) => handleAction(e)} />
          <ActionBtn icon={Map} label={t('community.calendar.maps')} onClick={(e) => handleAction(e)} />
          <ActionBtn icon={Bell} label={t('calendar.reminder.action')} onClick={(e) => handleAction(e)} />
          <ActionBtn icon={Bookmark} label={saved ? 'Saved' : 'Save'} active={saved} onClick={(e) => handleAction(e, toggleSave)} />
        </div>
      )}
    </Card>
  );
}

function ActionBtn({ icon: Icon, label, onClick, active }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-default ${
        active ? 'bg-primary/10 text-primary' : 'bg-muted/50 text-muted-foreground hover:bg-muted'
      }`}
    >
      <Icon className="w-3 h-3" />
      {label}
    </button>
  );
}