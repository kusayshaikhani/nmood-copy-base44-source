import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Mail, Clock, Calendar, Heart, Sparkles, MapPin } from 'lucide-react';

const reasonIcons = {
  time_gap: Clock,
  shared_experience: Calendar,
  wishlist_overlap: Heart,
};

export default function ReconnectCard({ suggestion, onInviteAgain, onDismiss }) {
  const isGroup = suggestion.reasonType === 'free_weekend';

  if (isGroup) {
    return (
      <div className="p-4 rounded-2xl border border-border bg-card">
        <div className="flex items-start gap-3 mb-3">
          <div className="flex -space-x-2 flex-shrink-0">
            {suggestion.palAvatars?.slice(0, 3).map((avatar, i) => (
              <Avatar key={i} className="w-10 h-10 border-2 border-card">
                <AvatarImage src={avatar} alt="" />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">?</AvatarFallback>
              </Avatar>
            ))}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{suggestion.reason}</p>
            <p className="text-xs text-muted-foreground mt-0.5">A great time to reconnect.</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-accent-foreground" />
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" className="flex-1 h-8 text-xs gap-1.5" onClick={() => onInviteAgain(suggestion)}>
            <Mail className="w-3 h-3" /> Invite All
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => onDismiss(suggestion.id)}>Dismiss</Button>
        </div>
      </div>
    );
  }

  const ReasonIcon = reasonIcons[suggestion.reasonType] || Sparkles;

  return (
    <div className="p-4 rounded-2xl border border-border bg-card">
      <div className="flex items-start gap-3 mb-3">
        <Avatar className="w-12 h-12 flex-shrink-0">
          <AvatarImage src={suggestion.palAvatar} alt={suggestion.palName} />
          <AvatarFallback className="bg-primary/10 text-primary">{suggestion.palName?.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{suggestion.palName}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {suggestion.palCity}
          </p>
        </div>
        <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center flex-shrink-0">
          <ReasonIcon className="w-4 h-4 text-primary" />
        </div>
      </div>

      <p className="text-sm text-foreground/80 mb-2">{suggestion.reason}</p>

      {suggestion.suggestedExperiences?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {suggestion.suggestedExperiences.map(exp => (
            <span key={exp} className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{exp}</span>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Button size="sm" className="flex-1 h-8 text-xs gap-1.5" onClick={() => onInviteAgain(suggestion)}>
          <Mail className="w-3 h-3" /> Invite Again
        </Button>
        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => onDismiss(suggestion.id)}>Dismiss</Button>
      </div>
    </div>
  );
}