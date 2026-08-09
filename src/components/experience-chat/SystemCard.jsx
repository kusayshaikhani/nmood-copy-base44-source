import React from 'react';
import { UserPlus, MapPin, Clock, Play, CheckCircle, Calendar, Info } from 'lucide-react';

const getIcon = (content) => {
  if (content?.includes('joined')) return UserPlus;
  if (content?.includes('location')) return MapPin;
  if (content?.includes('started') || content?.includes('completed')) return CheckCircle;
  if (content?.includes('starts')) return Clock;
  if (content?.includes('created')) return Calendar;
  return Info;
};

export default function SystemCard({ message }) {
  const Icon = getIcon(message.content);

  return (
    <div className="flex justify-center my-3 px-4">
      <div className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-muted/50 border border-border max-w-[90%]">
        <Icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
        <p className="text-xs text-muted-foreground text-center">{message.content}</p>
      </div>
    </div>
  );
}