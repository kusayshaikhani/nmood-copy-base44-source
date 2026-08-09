import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, Heart, MessageCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function LookingForMatchCard({ match, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="flex items-center gap-3 p-3 rounded-2xl border bg-card hover:shadow-md transition-default"
    >
      <div className="relative flex-shrink-0">
        <Avatar className="w-12 h-12">
          <AvatarImage src={match.avatar} alt={match.name} />
          <AvatarFallback>{match.name?.[0]}</AvatarFallback>
        </Avatar>
        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-success text-success-foreground text-[9px] font-bold flex items-center justify-center border-2 border-background">
          {match.matchScore}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{match.name}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-0.5">
            <MapPin className="w-3 h-3" /> {match.distance}
          </span>
          <span className="flex items-center gap-0.5">
            <Clock className="w-3 h-3" /> {match.availability}
          </span>
        </div>
        <div className="flex gap-1 mt-1 flex-wrap">
          {match.interests.slice(0, 2).map((interest) => (
            <Badge key={interest} variant="secondary" className="text-[10px] py-0 px-1.5">
              {interest}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5 flex-shrink-0">
        <Button size="sm" variant="outline" className="h-8 w-8 p-0">
          <MessageCircle className="w-3.5 h-3.5" />
        </Button>
        <Button size="sm" variant="default" className="h-8 w-8 p-0">
          <Heart className="w-3.5 h-3.5" />
        </Button>
      </div>
    </motion.div>
  );
}