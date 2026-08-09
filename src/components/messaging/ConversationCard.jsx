import React from 'react';
import { Pin, BellOff, Compass, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function ConversationCard({ conversation, onClick }) {
  const { name, avatar, lastMessage, timestamp, unread, online, muted, pinned, type } = conversation;

  let typeIcon = null;
  if (type === 'activity') typeIcon = <Compass className="w-2.5 h-2.5 text-primary-foreground" />;
  else if (type === 'circle') typeIcon = <Users className="w-2.5 h-2.5 text-primary-foreground" />;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-muted/40 transition-default text-start"
    >
      <div className="relative flex-shrink-0">
        <Avatar className="w-12 h-12">
          <AvatarImage src={avatar} alt={name} />
          <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
            {name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        {online && (
          <div className="absolute bottom-0 end-0 w-3.5 h-3.5 rounded-full bg-success border-2 border-card" />
        )}
        {typeIcon && (
          <div className="absolute -top-0.5 -start-0.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center border-2 border-card">
            {typeIcon}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            {pinned && <Pin className="w-3 h-3 text-muted-foreground flex-shrink-0" fill="currentColor" />}
            <h3 className="font-semibold text-sm truncate">{name}</h3>
          </div>
          <span className="text-xs text-muted-foreground flex-shrink-0">{timestamp}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            {muted && <BellOff className="w-3 h-3 text-muted-foreground flex-shrink-0" />}
            <p className="text-sm text-muted-foreground truncate">{lastMessage}</p>
          </div>
          {unread > 0 && (
            <span className="bg-primary text-primary-foreground text-xs font-bold min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center flex-shrink-0">
              {unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}