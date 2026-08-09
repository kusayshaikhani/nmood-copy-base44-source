import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search as SearchIcon, MapPin, Clock } from 'lucide-react';
import { useExperiences } from '@/lib/discover-store';
import { parseSearch, filterExperiences } from '@/lib/inmood-engine';

const EXAMPLES = [
  'Coffee tonight…',
  'Photography walk…',
  'Networking after work…',
  'Something outdoors…',
  'Board games…',
  'Arabic speakers…',
  'Free activities…',
  'Under AED 100…',
];

export default function InMoodSearch() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [ph, setPh] = useState(EXAMPLES[0]);
  const { experiences } = useExperiences();

  useEffect(() => {
    const t = setInterval(() => setPh(EXAMPLES[Math.floor(Math.random() * EXAMPLES.length)]), 2600);
    return () => clearInterval(t);
  }, []);

  const results = useMemo(() => {
    if (q.trim().length < 2) return [];
    return filterExperiences(experiences, parseSearch(q)).slice(0, 6);
  }, [q]);

  return (
    <section>
      <h2 className="font-bold text-lg px-1">Looking for something specific?</h2>
      <p className="text-sm text-muted-foreground mb-3 px-1">Search naturally.</p>
      <div className="relative">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={ph}
          className="w-full h-12 pl-11 pr-4 rounded-2xl bg-muted border border-transparent focus:border-primary focus:bg-card outline-none text-sm transition-default"
        />
      </div>

      {q.trim().length >= 2 && (
        <div className="mt-3 space-y-2">
          {results.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-4">No matches — try “free activities” or “coffee tonight”.</p>
          ) : results.map((e, i) => (
            <motion.button
              key={e.id}
              type="button"
              onClick={() => navigate(`/experience/${e.id}`)}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="w-full flex items-center gap-3 p-2.5 rounded-2xl border border-border bg-card hover:shadow-sm transition-default text-left"
            >
              <img src={e.image} alt={e.title} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium line-clamp-1">{e.title}</p>
                <p className="text-[10px] text-muted-foreground flex items-center gap-2 mt-0.5">
                  <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" /> {e.distance}</span>
                  <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" /> {e.time}</span>
                  <span>· {e.budget}</span>
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {q.trim().length < 2 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {['Free activities', 'Coffee tonight', 'Under AED 100', 'Arabic speakers', 'Outdoor this weekend'].map((s) => (
            <button key={s} type="button" onClick={() => setQ(s)} className="px-3 h-8 rounded-full bg-muted text-xs font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary transition-default">{s}</button>
          ))}
        </div>
      )}
    </section>
  );
}