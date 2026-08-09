import React from 'react';
import { Users, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SmartImage from '@/components/shared/SmartImage';

export default function CircleCard({ image, name, members, distance, mood }) {
  return (
    <div className="flex-shrink-0 w-52 rounded-2xl overflow-hidden border border-border bg-card hover-lift cursor-pointer">
      <div className="h-16 relative">
        <SmartImage src={image} alt={name} rounded="rounded-none" className="w-full h-full" />
      </div>
      <div className="p-3.5">
        <h3 className="font-semibold text-sm mb-1.5 line-clamp-1">{name}</h3>
        <div className="space-y-1 mb-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="w-3 h-3" />{members} members
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3" />{distance}
          </div>
          <span className="inline-block text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            {mood}
          </span>
        </div>
        <Button size="sm" variant="outline" className="w-full h-8">Join</Button>
      </div>
    </div>
  );
}