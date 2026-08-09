import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Clock, Bookmark } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function AIPicks({ items, emotion }) {
  const navigate = useNavigate();
  const { t } = useLocalization();
  if (!items.length) {
    return (
      <section>
        <h2 className="font-bold text-lg mb-3 px-1">{t('inmood.ai_picks.title')}</h2>
        <div className="rounded-2xl border border-dashed border-border bg-muted/20 py-8 px-4 text-center">
          {/* BUG-010 — Contextual guidance for empty AI Picks. */}
          <p className="text-sm text-muted-foreground">{t('inmood.ai_picks.empty_title')}</p>
          <p className="text-xs text-muted-foreground/70 mt-1">{t('inmood.ai_picks.empty_desc')}</p>
        </div>
      </section>
    );
  }
  return (
    <section>
      <div className="flex items-baseline justify-between px-1 mb-1">
        <h2 className="font-bold text-lg">{t('inmood.ai_picks.title')}</h2>
        <span className="text-[10px] text-muted-foreground/60">{t('lc002.ai.picks_label')}</span>
      </div>
      <p className="text-[11px] text-muted-foreground/70 px-1 mb-3">{t('lc002.ai.picks_desc')}</p>
      <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-1 pb-1">
        {items.map((e, i) => (
          <motion.div
            key={e.id}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex-shrink-0 w-44 rounded-2xl border border-border bg-card overflow-hidden shadow-sm"
          >
            <div className="relative h-28">
              <img src={e.image} alt={e.title} className="w-full h-full object-cover" loading="lazy" />
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/55 backdrop-blur text-white text-[10px] font-bold">{e._compat}% {t('inmood.ai_picks.match')}</div>
            </div>
            <div className="p-2.5">
              <p className="text-xs font-semibold line-clamp-2 leading-tight">{e.title}</p>
              <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" /> {e.distance}</span>
                <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" /> {e.time}</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <button onClick={() => navigate(`/experience/${e.id}`)} type="button" className="flex-1 h-8 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-default">{t('inmood.ai_picks.join')}</button>
                <button type="button" className="h-8 w-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-default"><Bookmark className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}