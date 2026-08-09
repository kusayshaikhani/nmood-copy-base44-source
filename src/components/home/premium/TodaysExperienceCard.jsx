import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bookmark, ChevronRight, MapPin } from 'lucide-react';
import SmartImage from '@/components/shared/SmartImage';
import SectionTitle from '@/components/ui/premium/SectionTitle';
import { useLocalization } from '@/lib/i18n/useLocalization';

/**
 * UI-001 — "Today's Experiences". A single large hero-style card using the
 * top recommended experience. Display only; tapping opens the existing detail
 * route. No business logic changed.
 */
export default function TodaysExperienceCard({ experiences = [] }) {
  const navigate = useNavigate();
  const { t } = useLocalization();
  const [saved, setSaved] = useState(false);
  const exp = experiences[0];
  if (!exp) return null;

  const time = exp.time || '7:00 PM';
  const hostAvatar = exp.host?.avatar || exp.host_avatar;
  const locationLabel = exp.location || exp.location_address || exp.distance || 'Location';

  return (
    <section>
      <SectionTitle>{t('home.todays_experiences')}</SectionTitle>
      <motion.button
        type="button"
        onClick={() => navigate(`/experience/${exp.id}`)}
        whileTap={{ scale: 0.98 }}
        className="block w-full text-start rounded-card overflow-hidden shadow-card border border-border/40 bg-card"
      >
        <div className="relative h-56">
          <SmartImage
            src={exp.image || exp.cover_image}
            alt={exp.title}
            rounded="rounded-none"
            className="w-full h-full"
            fallback={<div className="w-full h-full bg-primary/10" />}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

          <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-semibold">
            Today • {time}
          </span>

          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setSaved((s) => !s); }}
            aria-label="Save experience"
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center"
          >
            <Bookmark className={`w-5 h-5 text-white ${saved ? 'fill-white' : ''}`} />
          </button>

          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="text-white text-xl font-bold leading-tight line-clamp-2">{exp.title}</h3>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2 min-w-0">
                <SmartImage
                  src={hostAvatar}
                  alt=""
                  rounded="rounded-full"
                  className="w-7 h-7 border-2 border-white/60 flex-shrink-0"
                  fallback={<div className="w-7 h-7 rounded-full bg-white/30 border-2 border-white/60 flex-shrink-0" />}
                />
                <span className="text-white/90 text-xs font-medium flex items-center gap-1 truncate">
                  <MapPin className="w-3 h-3 flex-shrink-0" />{locationLabel}
                </span>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0">
                <ChevronRight className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </div>
      </motion.button>
    </section>
  );
}