import React from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, Circle } from 'lucide-react';

export default function SharedJourney({ pal }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3 mb-4">
        <Avatar className="w-12 h-12">
          <AvatarImage src={pal.avatar} alt={pal.name} />
          <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-sm font-bold">{pal.initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <h3 className="font-semibold">{pal.name}</h3>
          <p className="text-xs text-muted-foreground truncate">First met: {pal.firstMet}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 rounded-xl bg-muted/40">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Activities Together</span>
          </div>
          <p className="text-lg font-bold">{pal.activitiesTogether}</p>
        </div>
        <div className="p-3 rounded-xl bg-muted/40">
          <div className="flex items-center gap-2 mb-1">
            <Circle className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Circles Together</span>
          </div>
          <p className="text-lg font-bold">{pal.circlesTogether}</p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Shared Activities</p>
          <div className="flex flex-wrap gap-1.5">
            {pal.activityNames.map((name, i) => (
              <span key={i} className="text-xs px-2 py-1 rounded-lg bg-primary/5 text-primary">{name}</span>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Shared Circles</p>
          <div className="flex flex-wrap gap-1.5">
            {pal.circleNames.map((name, i) => (
              <span key={i} className="text-xs px-2 py-1 rounded-lg bg-accent/20 text-accent-foreground">{name}</span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Shared Interests</p>
            <div className="flex flex-wrap gap-1.5">
              {pal.sharedInterests.map((interest, i) => (
                <span key={i} className="text-xs px-2 py-1 rounded-lg bg-muted text-muted-foreground">{interest}</span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Languages</p>
            <div className="flex flex-wrap gap-1.5">
              {pal.languages.map((lang, i) => (
                <span key={i} className="text-xs px-2 py-1 rounded-lg bg-muted text-muted-foreground">{lang}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}