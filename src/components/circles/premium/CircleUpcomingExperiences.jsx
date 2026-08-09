import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Users, Plus, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocalization } from '@/lib/i18n/useLocalization';

/**
 * Upcoming experiences as large horizontal snap-scrolling cards.
 * Each card: cover image, title, date, time, location, going count.
 * Tap opens Experience Details.
 */
export default function CircleUpcomingExperiences({ circle, onCreate }) {
  const navigate = useNavigate();
  const { t } = useLocalization();
  const items = circle.upcoming_experiences || [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-section-title font-semibold">{t('community.calendar.upcoming')}</h2>
        <Button variant="ghost" size="sm" className="gap-1 text-primary" onClick={onCreate}>
          <Plus className="w-4 h-4" /> {t('circles.experiences.create')}
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="p-6 rounded-card border border-dashed border-border text-center">
          <p className="text-sm font-medium text-muted-foreground">{t('circles.detail.no_upcoming')}</p>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto no-scrollbar overscroll-x-contain snap-x snap-mandatory -mx-4 px-4 pb-1">
          {items.map((item, i) => (
            <motion.button
              key={i}
              type="button"
              onClick={() => navigate(`/experience/${item.id}`)}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
              className="snap-start flex-shrink-0 w-72 text-start rounded-card overflow-hidden bg-card border border-border/60 shadow-soft hover:shadow-card transition-default pressable"
            >
              <div className="relative h-36 bg-muted">
                {item.image ? (
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                {item.category && (
                  <span className="absolute top-2.5 start-2.5 text-[10px] font-semibold uppercase tracking-wide text-white bg-black/30 backdrop-blur-md px-2 py-1 rounded-full">
                    {item.category}
                  </span>
                )}
              </div>
              <div className="p-4 space-y-2">
                <p className="font-semibold text-sm leading-snug line-clamp-2">{item.title}</p>
                <div className="flex items-center gap-3 text-caption text-muted-foreground flex-wrap">
                  <span className="inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {item.date}</span>
                  {item.time && <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {item.time}</span>}
                </div>
                <div className="flex items-center gap-3 text-caption text-muted-foreground flex-wrap">
                  {item.location && <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> <span className="truncate max-w-[140px]">{item.location}</span></span>}
                  {item.attendance != null && <span className="inline-flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {item.attendance}</span>}
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">{t('circles.detail.view_details')} <ChevronRight className="w-3.5 h-3.5" /></span>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}