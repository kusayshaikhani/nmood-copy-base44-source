import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MapPin } from 'lucide-react';

const strengthStyles = {
  1: 'bg-primary/10 text-primary',
  2: 'bg-accent/20 text-accent-foreground',
  3: 'bg-success/10 text-success',
};

export default function RelationshipHeader({ pal, currentUser, strength }) {
  const youName = currentUser?.full_name || 'You';
  const youInitial = youName.charAt(0).toUpperCase();

  return (
    <div className="rounded-3xl bg-gradient-to-br from-primary/5 via-card to-accent/5 border border-border p-6 text-center">
      <div className="flex items-center justify-center gap-3 mb-3">
        <div className="flex flex-col items-center">
          <Avatar className="w-16 h-16 border-2 border-background shadow-md">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">{youInitial}</AvatarFallback>
          </Avatar>
          <span className="text-xs font-medium mt-1.5 max-w-[80px] truncate">You</span>
        </div>
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Heart className="w-5 h-5 text-primary fill-current" />
        </div>
        <div className="flex flex-col items-center">
          <Avatar className="w-16 h-16 border-2 border-background shadow-md">
            <AvatarImage src={pal.avatar} alt={pal.name} />
            <AvatarFallback className="bg-accent/20 text-accent-foreground font-semibold text-lg">{pal.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <span className="text-xs font-medium mt-1.5 max-w-[80px] truncate">{pal.name.split(' ')[0]}</span>
        </div>
      </div>

      <h1 className="text-xl font-bold tracking-tight">You & {pal.name}</h1>
      <p className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-0.5">
        <MapPin className="w-3 h-3" /> Pals since {pal.connectedDate}
      </p>

      {strength && (
        <span className={`inline-block mt-2.5 px-3 py-1 rounded-full text-xs font-semibold ${strengthStyles[strength.level]}`}>
          {strength.label}
        </span>
      )}

      <div className="grid grid-cols-3 gap-2 mt-4">
        <div className="p-2.5 rounded-xl bg-card/60">
          <p className="text-lg font-bold">{pal.mutualExperiences}</p>
          <p className="text-[10px] text-muted-foreground">Experiences</p>
        </div>
        <div className="p-2.5 rounded-xl bg-card/60">
          <p className="text-lg font-bold">{Math.min(pal.mutualExperiences, 3)}</p>
          <p className="text-[10px] text-muted-foreground">Shared Circles</p>
        </div>
        <div className="p-2.5 rounded-xl bg-card/60">
          <p className="text-lg font-bold">{pal.sharedInterests?.length || 0}</p>
          <p className="text-[10px] text-muted-foreground">Shared Interests</p>
        </div>
      </div>
    </div>
  );
}