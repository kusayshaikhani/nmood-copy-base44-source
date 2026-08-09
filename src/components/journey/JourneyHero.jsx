import React from 'react';
import { motion } from 'framer-motion';
import { Share2, Calendar, Sparkles, Users, MapPin, Coffee } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { journeyStats, coverImage, memberPhoto } from '@/lib/journey-data';

const stats = [
  { icon: Sparkles, label: 'Hosted', value: journeyStats.experiencesHosted },
  { icon: Coffee, label: 'Joined', value: journeyStats.experiencesJoined },
  { icon: Users, label: 'Pals', value: journeyStats.palsMade },
  { icon: MapPin, label: 'Cities', value: journeyStats.citiesExplored },
];

export default function JourneyHero({ member, onShare }) {
  const name = member?.display_name || member?.first_name || 'Member';
  const photo = member?.photo_url || memberPhoto;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      <div className="relative h-52 sm:h-64 rounded-3xl overflow-hidden">
        <img src={coverImage} alt="Journey cover" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute top-4 right-4">
          <Button
            size="icon"
            variant="secondary"
            className="rounded-full bg-white/20 backdrop-blur-md border-white/20 text-white hover:bg-white/30"
            onClick={onShare}
          >
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">My Journey</h1>
          <p className="text-sm text-white/80">A story of connections, memories, and growth.</p>
        </div>
      </div>

      <div className="flex items-center gap-4 px-1">
        <Avatar className="w-20 h-20 border-4 border-card shadow-lg -mt-12 flex-shrink-0">
          <AvatarImage src={photo} alt={name} />
          <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
            {name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0 pt-2">
          <h2 className="text-xl font-bold truncate">{name}</h2>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            Member since {journeyStats.memberSince}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-card border border-border"
          >
            <stat.icon className="w-4 h-4 text-primary" />
            <span className="text-xl font-bold">{stat.value}</span>
            <span className="text-[10px] sm:text-xs text-muted-foreground">{stat.label}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}