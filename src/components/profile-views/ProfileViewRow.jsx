import React from 'react';
import { MapPin, BadgeCheck, MessageCircle, UserPlus, Clock } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getConnectionState, formatViewedTime } from '@/lib/profile-views';

export default function ProfileViewRow({ view, onConnect, onMessage }) {
  const state = getConnectionState(view);
  const initials = (view.viewer_name || '?').charAt(0).toUpperCase();

  return (
    <div className="flex flex-col gap-3 p-4 rounded-2xl border border-border bg-card">
      <div className="flex items-start gap-3">
        <div className="relative flex-shrink-0">
          <Avatar className="w-12 h-12 border-2 border-card shadow-sm">
            <AvatarImage src={view.viewer_avatar} alt={view.viewer_name} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">{initials}</AvatarFallback>
          </Avatar>
          {view.viewer_verified && (
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary border-2 border-card flex items-center justify-center">
              <BadgeCheck className="w-2.5 h-2.5 text-primary-foreground" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="font-semibold text-sm truncate">{view.viewer_name}</p>
            {view.viewer_age != null && <span className="text-xs text-muted-foreground">{view.viewer_age}</span>}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{view.viewer_location || 'Unknown'}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
            <Clock className="w-3 h-3 flex-shrink-0" />
            <span>{formatViewedTime(view.viewed_at)}</span>
          </div>
        </div>

        <div className="flex-shrink-0">
          {state === 'connected' && (
            <Button size="sm" className="gap-1.5" onClick={onMessage}>
              <MessageCircle className="w-3.5 h-3.5" /> Message
            </Button>
          )}
          {state === 'pending' && (
            <Button size="sm" variant="outline" disabled className="gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Pending
            </Button>
          )}
          {state === 'not_connected' && (
            <Button size="sm" className="gap-1.5" onClick={onConnect}>
              <UserPlus className="w-3.5 h-3.5" /> Connect
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {view.shared_interests?.length > 0 && (
          <div>
            <p className="text-[11px] text-muted-foreground mb-1">Shared Interests</p>
            <div className="flex flex-wrap gap-1">
              {view.shared_interests.map((i) => (
                <Badge key={i} variant="secondary" className="text-[10px] py-0.5">{i}</Badge>
              ))}
            </div>
          </div>
        )}
        {view.shared_moods?.length > 0 && (
          <div>
            <p className="text-[11px] text-muted-foreground mb-1">Shared Moods</p>
            <div className="flex flex-wrap gap-1">
              {view.shared_moods.map((m) => (
                <Badge key={m} variant="outline" className="text-[10px] py-0.5 text-primary border-primary/30">{m}</Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {(view.mutual_circles > 0 || view.mutual_experiences > 0) && (
        <div className="flex flex-wrap gap-2">
          {view.mutual_circles > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs">
              {view.mutual_circles} Mutual Circle{view.mutual_circles === 1 ? '' : 's'}
            </span>
          )}
          {view.mutual_experiences > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs">
              {view.mutual_experiences} Mutual Experience{view.mutual_experiences === 1 ? '' : 's'}
            </span>
          )}
        </div>
      )}
    </div>
  );
}