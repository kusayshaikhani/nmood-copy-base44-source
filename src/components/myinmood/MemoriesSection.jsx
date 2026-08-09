import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Camera, Calendar, Award } from 'lucide-react';
import { useMemoriesData } from '@/lib/myinmood-live';

/**
 * UI-008 — Modern achievements / memories section.
 * Premium milestone cards with gradient accent + scroll-reveal animation.
 * Data hook and logic unchanged.
 */
export default function MemoriesSection() {
  const navigate = useNavigate();
  const { data, loading } = useMemoriesData();

  if (loading) {
    return (
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">Memories</h2>
          <button onClick={() => navigate('/journey')} className="text-xs text-primary font-medium" type="button">See all</button>
        </div>
        <div className="space-y-3">
          <div className="h-28 rounded-card bg-muted animate-pulse" />
          <div className="h-20 rounded-card bg-muted animate-pulse" />
        </div>
      </section>
    );
  }

  const hasAny = data.recentPhotos.length > 0 || data.recentExperiences.length > 0 || data.recentMilestones.length > 0;
  if (!hasAny) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">Memories</h2>
        <button onClick={() => navigate('/journey')} className="text-xs text-primary font-medium" type="button">See all</button>
      </div>
      <div className="space-y-5">
        {data.recentPhotos.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2.5">
              <Camera className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold">Recent Photos</h3>
            </div>
            <div className="flex gap-2.5 overflow-x-auto no-scrollbar -mx-6 px-6 sm:mx-0 sm:px-0 snap-x snap-mandatory">
              {data.recentPhotos.map((photo, i) => (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="w-28 h-28 flex-shrink-0 rounded-card overflow-hidden cursor-pointer group snap-start"
                  onClick={() => navigate('/journey')}
                >
                  <img src={photo.url} alt={photo.caption} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {data.recentExperiences.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2.5">
              <Calendar className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold">Recent Experiences</h3>
            </div>
            <div className="space-y-2">
              {data.recentExperiences.map((exp, i) => (
                <motion.div
                  key={exp.id}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-card bg-card border border-border/50"
                >
                  <span className="text-lg">{exp.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{exp.title}</p>
                    <p className="text-xs text-muted-foreground">{exp.date}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {data.recentMilestones.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2.5">
              <Award className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold">Recent Milestones</h3>
            </div>
            <div className="space-y-2.5">
              {data.recentMilestones.map((m, i) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-center gap-3 p-3 rounded-card bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/15"
                >
                  <div className="w-10 h-10 rounded-full bg-nmood-gradient flex items-center justify-center text-lg shadow-sm flex-shrink-0">
                    {m.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{m.title}</p>
                    <p className="text-xs text-muted-foreground">{m.date}</p>
                  </div>
                  <Award className="w-4 h-4 text-primary/40 flex-shrink-0" />
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}