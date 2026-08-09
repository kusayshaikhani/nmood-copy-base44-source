import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Clock, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function FriendsGoing({ items }) {
  const navigate = useNavigate();
  if (!items.length) return null;
  return (
    <section>
      <h2 className="font-bold text-lg mb-3 px-1">Pals' Nmood for</h2>
      <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-1 pb-1">
        {items.map((e, i) => {
          const friends = (e.attendees || []).slice(0, 4);
          return (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex-shrink-0 w-44 rounded-2xl border border-border bg-card overflow-hidden shadow-sm"
            >
              <div className="relative h-28">
                <img src={e.image} alt={e.title} className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-2 left-2 flex -space-x-2">
                  {friends.map((a, idx) => (
                    <Avatar key={idx} className="w-6 h-6 border-2 border-white"><AvatarImage src={a} /><AvatarFallback className="text-[8px]">F</AvatarFallback></Avatar>
                  ))}
                </div>
                <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-black/45 backdrop-blur text-white text-[10px] font-medium flex items-center gap-0.5">
                  <Users className="w-2.5 h-2.5" /> {e.attendees?.length}
                </div>
              </div>
              <div className="p-2.5">
                <p className="text-xs font-semibold line-clamp-1">{e.title}</p>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" /> {e.distance}</span>
                  <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" /> {e.time}</span>
                </div>
                <button onClick={() => navigate(`/experience/${e.id}`)} type="button" className="mt-2 w-full h-8 rounded-button bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-default">Join</button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}