import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Users, Crown, Calendar, Camera, Award } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function CommunityAbout({ community }) {
  const { t } = useLocalization();
  const navigate = useNavigate();

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-semibold mb-2">{t('community.about.title')}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">{community.description}</p>
      </div>

      <div className="p-4 rounded-2xl border border-border bg-card">
        <div className="flex items-center gap-2 mb-3">
          <Crown className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">{t('community.about.organizers')}</h3>
        </div>
        <div className="space-y-2.5">
          {community.members.filter((m) => ['owner', 'admin'].includes(m.role)).map((m) => (
            <div key={m.name} className="flex items-center gap-2.5">
              <Avatar className="w-9 h-9">
                <AvatarImage src={m.avatar} alt={m.name} />
                <AvatarFallback className="text-xs bg-primary/10 text-primary">{m.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{m.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{m.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm">{t('community.calendar.upcoming')}</h3>
          <button onClick={() => navigate('/explore')} className="text-xs text-primary font-medium" type="button">{t('community.about.see_all')}</button>
        </div>
        <div className="flex gap-2.5 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          {community.upcoming_experiences.map((exp) => (
            <motion.div
              key={exp.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(`/experience/${exp.id}`)}
              className="w-40 flex-shrink-0 rounded-2xl overflow-hidden border border-border bg-card cursor-pointer hover-lift"
            >
              <img src={exp.image} alt={exp.title} className="w-full h-20 object-cover" loading="lazy" />
              <div className="p-2.5">
                <p className="font-semibold text-xs line-clamp-1">{exp.title}</p>
                <p className="text-[11px] text-primary font-medium">{exp.date} · {exp.time}</p>
                <p className="text-[10px] text-muted-foreground">by {exp.host}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-sm mb-2">{t('community.about.recent_memories')}</h3>
        <div className="space-y-2">
          {community.recent_memories.map((mem, i) => (
            <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-card border border-border">
              {mem.type === 'photo' ? (
                <img src={mem.url} alt={mem.caption} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" loading="lazy" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  {mem.type === 'experience' ? <Calendar className="w-5 h-5 text-primary" /> : <Award className="w-5 h-5 text-primary" />}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{mem.caption || mem.title}</p>
                <p className="text-xs text-muted-foreground">{mem.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}