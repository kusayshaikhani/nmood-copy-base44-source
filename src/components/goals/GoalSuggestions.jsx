import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, Wallet, Users, Calendar, ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getGoalSuggestions } from '@/lib/goals-data';

export default function GoalSuggestions({ goalKey }) {
  const navigate = useNavigate();
  const suggestions = getGoalSuggestions(goalKey);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">Suggested Experiences</h2>
        <p className="text-sm text-muted-foreground mb-3">Handpicked to help you reach this goal.</p>
        <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          {suggestions.experiences.map((exp) => (
            <motion.div
              key={exp.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(`/experience/${exp.id}`)}
              className="w-64 flex-shrink-0 rounded-2xl overflow-hidden border border-border bg-card hover-lift cursor-pointer"
            >
              <img src={exp.image} alt={exp.title} className="w-full h-28 object-cover" loading="lazy" />
              <div className="p-3">
                <p className="font-semibold text-sm line-clamp-1">{exp.title}</p>
                <p className="text-xs text-muted-foreground mb-2">by {exp.host}</p>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{exp.distance}</span>
                  <span className="flex items-center gap-0.5"><Wallet className="w-3 h-3" />{exp.budget}</span>
                </div>
                <p className="text-[11px] text-primary font-medium mt-1.5 flex items-center gap-0.5">
                  <Clock className="w-3 h-3" />{exp.date}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-1">Suggested Circles</h2>
        <p className="text-sm text-muted-foreground mb-3">Communities aligned with your goal.</p>
        <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          {suggestions.circles.map((circle) => (
            <motion.div
              key={circle.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(`/circle/${circle.id}`)}
              className="w-56 flex-shrink-0 rounded-2xl overflow-hidden border border-border bg-card hover-lift cursor-pointer"
            >
              <img src={circle.image} alt={circle.title} className="w-full h-20 object-cover" loading="lazy" />
              <div className="p-3">
                <p className="font-semibold text-sm line-clamp-1">{circle.title}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="w-3 h-3" />{circle.members} members
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-1">Suggested Pals</h2>
        <p className="text-sm text-muted-foreground mb-3">Members with similar goals.</p>
        <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          {suggestions.pals.map((pal) => (
            <motion.div
              key={pal.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/pals')}
              className="w-36 flex-shrink-0 flex flex-col items-center gap-2 p-3 rounded-2xl border border-border bg-card hover-lift cursor-pointer text-center"
            >
              <Avatar className="w-14 h-14">
                <AvatarImage src={pal.avatar} alt={pal.name} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                  {pal.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <p className="font-medium text-xs truncate w-full">{pal.name}</p>
              <div className="flex flex-wrap gap-1 justify-center">
                {pal.mutual_interests.slice(0, 2).map((interest) => (
                  <span key={interest} className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {interest}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-1">Upcoming Opportunities</h2>
        <p className="text-sm text-muted-foreground mb-3">Don't miss these.</p>
        <div className="space-y-2">
          {suggestions.opportunities.map((opp) => (
            <motion.div
              key={opp.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/explore')}
              className="flex items-center gap-3 p-3.5 rounded-2xl border border-border bg-card hover-lift cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{opp.title}</p>
                <p className="text-xs text-muted-foreground">{opp.date} · {opp.venue}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}