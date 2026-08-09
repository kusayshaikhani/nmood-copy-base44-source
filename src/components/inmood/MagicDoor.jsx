import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw, MapPin, Clock, Share2, Bookmark } from 'lucide-react';
import { useExperiences } from '@/lib/discover-store';
import { compatibility, reasonFor, magicScore } from '@/lib/inmood-engine';
import { isExperienceExpired } from '@/lib/discover-engine';
import { trackProductEvent, PRODUCT_EVENTS } from '@/lib/product-analytics';

export default function MagicDoor({ emotion, energy, interests = [] }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const [pick, setPick] = useState(null);
  const { experiences } = useExperiences();

  const reveal = () => {
    trackProductEvent(PRODUCT_EVENTS.MAGIC_DOOR_USED);
    setRevealing(true);
    setTimeout(() => {
      let recent = [];
      try { recent = JSON.parse(sessionStorage.getItem('inmood_magic_recent') || '[]'); } catch { /* ignore */ }
      const active = experiences.filter((e) => !isExperienceExpired(e));
      const pool = active.filter((e) => !recent.includes(String(e.id)));
      const source = pool.length ? pool : active;
      const sorted = source
        .map((e) => ({ ...e, _magic: magicScore(e, emotion || 'surprise', energy, interests) }))
        .sort((a, b) => b._magic - a._magic);
      const top = sorted.slice(0, 6);
      const e = top[Math.floor(Math.random() * top.length)] || sorted[0] || null;
      if (!e) { setRevealing(false); return; }
      const nextRecent = [String(e.id), ...recent.filter((id) => id !== String(e.id))].slice(0, 8);
      try { sessionStorage.setItem('inmood_magic_recent', JSON.stringify(nextRecent)); } catch { /* ignore */ }
      setPick({ ...e, _compat: compatibility(e, emotion || 'surprise', energy, interests) });
      setRevealing(false);
      setOpen(true);
    }, 700);
  };

  const another = () => { setOpen(false); setTimeout(reveal, 200); };

  return (
    <section>
      <h2 className="font-bold text-lg mb-3 px-1">Magic Door</h2>
      <div className="flex flex-col items-center py-4">
        <motion.button
          type="button"
          onClick={reveal}
          whileTap={{ scale: 0.95 }}
          animate={{ boxShadow: ['0 0 0 0 hsl(var(--primary)/0.4)', '0 0 0 18px hsl(var(--primary)/0)'] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent text-white flex flex-col items-center justify-center shadow-xl shadow-primary/30 disabled:opacity-50"
          disabled={revealing}
        >
          {revealing ? <Sparkles className="w-7 h-7 animate-spin" /> : <><Sparkles className="w-6 h-6 mb-1" /><span className="text-[10px] font-semibold leading-tight text-center">Open My Next<br />Experience</span></>}
        </motion.button>

        <AnimatePresence>
          {open && pick && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="mt-6 w-full rounded-[20px] overflow-hidden border border-border bg-card shadow-elevated"
            >
              <div className="relative h-48">
                <img src={pick.image} alt={pick.title} className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold">{pick._compat}%</div>
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="text-white font-bold">{pick.title}</h3>
                  <div className="flex items-center gap-3 mt-1 text-white/90 text-xs">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {pick.distance}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {pick.time}</span>
                  </div>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <p className="text-sm text-muted-foreground">{reasonFor(pick, emotion || 'surprise')}</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => navigate(`/experience/${pick.id}`)} type="button" className="flex-1 h-11 rounded-button bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-default">Join</button>
                  <button className="h-11 w-11 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-default" type="button"><Bookmark className="w-4 h-4" /></button>
                  <button className="h-11 w-11 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-default" type="button"><Share2 className="w-4 h-4" /></button>
                </div>
                <button onClick={another} type="button" className="w-full h-10 rounded-button border border-dashed border-primary/40 text-primary text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-primary/5 transition-default">
                  <RefreshCw className="w-3.5 h-3.5" /> Generate Another
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}